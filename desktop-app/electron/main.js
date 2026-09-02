const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, screen, Notification } = require('electron')
const { execFile, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// Set the Windows identity before app readiness so native notifications can register reliably.
if (process.platform === 'win32') app.setAppUserModelId('com.ispa.spinealignment')

app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-gpu-compositing')
app.commandLine.appendSwitch('in-process-gpu')

let mainWindow
let trayPopup
let postureAlertWindow = null
let postureAlertCloseTimer = null
let tray
let isQuitting = false
let monitoringPaused = false
let bluetoothSelectionCallback = null
let serialReader = null
let serialReaderRequested = false
let serialConfig = { port: process.env.ISPA_SERIAL_PORT || '' }
let telemetryStatus = { state: 'disconnected', listening: false, port: serialConfig.port, error: null }
const isDevelopment = process.env.ISPA_DEV === '1'
const MINUTE_MS = 60 * 1000
const MOVEMENT_WINDOW_MS = 90 * 1000
const MOVEMENT_THRESHOLD_DEGREES = 5
const MAX_BREAK_REMINDER_RESENDS = 10
const MAX_NOTIFICATION_LOG = 50
const TIMER_STATE_INTERVAL_MS = 1000
const POSTURE_ALERT_GOOD_DEBOUNCE_MS = 1000
const WORK_MODE_MS = 20 * MINUTE_MS
const WALK_MODE_MS = 10 * MINUTE_MS
let breakReminderTimer = null
let breakReminderStartedAt = null
let breakReminderIndex = 0
let breakFollowUpTimer = null
let breakFollowUpResends = 0
let breakFollowUpWarningShown = false
let cyclePhase = 'disconnected'
let cyclePhaseDueAt = null
let movementReadings = []
let hasRecentMovement = false
// Persistent posture state: prevents repeated alerts while bad posture continues.
let isCurrentlyBad = false
let notificationLog = []
let activeNotifications = []
let timerStateInterval = null
let breakReminderDueAt = null
let breakFollowUpDueAt = null

function sendNotificationLogEntry(type, title, body) {
  const entry = { type, title, body, timestamp: Date.now() }
  notificationLog = [...notificationLog, entry].slice(-MAX_NOTIFICATION_LOG)
  broadcastTelemetry('notification-log-update', entry)
}

function getBreakTimerState() {
  const now = Date.now()
  const phase = cyclePhase === 'walk' ? 'walk-in-progress' : 'waiting-for-break'
  const seconds = cyclePhaseDueAt === null ? null : Math.max(0, Math.ceil((cyclePhaseDueAt - now) / 1000))

  return {
    phase,
    timeUntilNextBreakPrompt: phase === 'waiting-for-break' ? seconds : null,
    timeUntilNextResendCheck: breakFollowUpDueAt === null ? null : Math.max(0, Math.ceil((breakFollowUpDueAt - now) / 1000)),
    timeUntilBackToWork: phase === 'walk-in-progress' ? seconds : null,
    hasRecentMovement,
  }
}

function startTimerStateBroadcast() {
  if (timerStateInterval !== null) return
  timerStateInterval = setInterval(() => broadcastTelemetry('break-timer-state', getBreakTimerState()), TIMER_STATE_INTERVAL_MS)
}

function stopTimerStateBroadcast() {
  if (timerStateInterval !== null) clearInterval(timerStateInterval)
  timerStateInterval = null
}

function sendSystemNotification(type, title, body, { log = true } = {}) {
  try {
    if (!Notification.isSupported()) {
      console.warn(`Notification requested but Electron reports native notifications are unsupported or disabled: ${type}`)
      return false
    }
    console.log(`Notification requested: ${type} — ${title}`)
    // Electron exposes timeoutType on Linux, but Windows delegates toast timing
    // to the OS. Use the platform option where available and always enforce the
    // two-second cap ourselves below.
    const notificationOptions = { title, body }
    if (process.platform === 'linux') notificationOptions.timeoutType = 'default'
    const notification = new Notification(notificationOptions)
    activeNotifications.push(notification)
    notification.once('show', () => console.log(`Notification shown by OS: ${type}`))
    const closeTimer = setTimeout(() => notification.close(), 2000)
    notification.once('close', () => {
      clearTimeout(closeTimer)
      activeNotifications = activeNotifications.filter((item) => item !== notification)
    })
    notification.show()
    if (log) sendNotificationLogEntry(type, title, body)
    return true
  } catch (error) {
    console.warn('Unable to show system notification:', error.message)
    return false
  }
}

function stopBreakReminderSchedule() {
  if (breakReminderTimer !== null) clearTimeout(breakReminderTimer)
  if (breakFollowUpTimer !== null) clearTimeout(breakFollowUpTimer)
  breakReminderTimer = null
  breakFollowUpTimer = null
  breakReminderDueAt = null
  breakFollowUpDueAt = null
  breakReminderStartedAt = null
  breakReminderIndex = 0
  breakFollowUpResends = 0
  breakFollowUpWarningShown = false
  cyclePhase = 'disconnected'
  cyclePhaseDueAt = null
}

function resetMovementTracking() {
  movementReadings = []
  hasRecentMovement = false
}

function resetPostureAlertTracking() {
  isCurrentlyBad = false
  hidePostureAlertOverlay()
}

function createPostureAlertOverlay() {
  if (postureAlertWindow && !postureAlertWindow.isDestroyed()) return postureAlertWindow

  postureAlertWindow = new BrowserWindow({
    frame: false,
    transparent: true,
    fullscreen: true,
    fullscreenable: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    show: false,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  postureAlertWindow.setAlwaysOnTop(true, 'screen-saver')
  postureAlertWindow.setIgnoreMouseEvents(true)
  postureAlertWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          :root { color-scheme: dark; font-family: Segoe UI, Arial, sans-serif; }
          html, body { width: 100%; height: 100%; margin: 0; }
          body { display: grid; place-items: center; background: rgba(92, 8, 18, 0.72); }
          .alert { max-width: 80vw; padding: 42px 64px; border: 2px solid rgba(255, 190, 190, 0.75); border-radius: 24px; background: rgba(45, 4, 12, 0.94); box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5); text-align: center; }
          .icon { font-size: 58px; line-height: 1; }
          h1 { margin: 20px 0 10px; color: #fff4f4; font-size: clamp(32px, 5vw, 64px); line-height: 1.1; }
          p { margin: 0; color: #ffd7d7; font-size: clamp(18px, 2vw, 28px); }
        </style>
      </head>
      <body><main class="alert" role="alert" aria-live="assertive"><div class="icon">⚠</div><h1>Bad posture detected</h1><p>Sit up straight and reset your posture.</p></main></body>
    </html>
  `)}`)
  postureAlertWindow.on('closed', () => { postureAlertWindow = null })
  return postureAlertWindow
}

function showPostureAlertOverlay() {
  if (postureAlertCloseTimer !== null) {
    clearTimeout(postureAlertCloseTimer)
    postureAlertCloseTimer = null
  }

  const overlay = createPostureAlertOverlay()
  if (!overlay || overlay.isDestroyed()) return

  // Keep the scope to the primary display for now. Extending this to every
  // connected display can be added later without changing posture detection.
  const primaryDisplay = screen.getPrimaryDisplay()
  overlay.setBounds(primaryDisplay.bounds)
  overlay.setAlwaysOnTop(true, 'screen-saver')
  overlay.showInactive()
}

function hidePostureAlertOverlay() {
  if (postureAlertCloseTimer !== null) clearTimeout(postureAlertCloseTimer)
  postureAlertCloseTimer = null
  if (postureAlertWindow && !postureAlertWindow.isDestroyed()) postureAlertWindow.hide()
}

function schedulePostureAlertOverlayClose() {
  if (postureAlertCloseTimer !== null) clearTimeout(postureAlertCloseTimer)
  postureAlertCloseTimer = setTimeout(() => {
    postureAlertCloseTimer = null
    hidePostureAlertOverlay()
  }, POSTURE_ALERT_GOOD_DEBOUNCE_MS)
}

function handleMovementReading(event) {
  const now = Date.now()
  const angles = [event.neckX, event.neckY, event.lumbarX, event.lumbarY]
  movementReadings.push({ at: now, angles })
  movementReadings = movementReadings.filter((reading) => now - reading.at <= MOVEMENT_WINDOW_MS)

  const ranges = angles.map((_, index) => {
    const values = movementReadings.map((reading) => reading.angles[index])
    return Math.max(...values) - Math.min(...values)
  })
  hasRecentMovement = ranges.some((range) => range >= MOVEMENT_THRESHOLD_DEGREES)

  return hasRecentMovement
}

function handlePostureAlert(binary) {
  const currentBinary = Number(binary)

  if (currentBinary === 0) {
    // Bad posture: only the first bad reading after good posture can notify.
    if (!isCurrentlyBad) {
      sendSystemNotification('bad-posture', 'Posture Alert', 'Your posture has dropped — sit up straight to protect your spine.')
      showPostureAlertOverlay()
      isCurrentlyBad = true
    }
    // Already bad: intentionally do nothing for subsequent packets.
    return
  }

  // Good posture re-arms the next good -> bad transition.
  if (isCurrentlyBad) {
    isCurrentlyBad = false
    schedulePostureAlertOverlayClose()
  }
}

function scheduleBreakFollowUp() {
  if (breakReminderStartedAt === null) return
  breakFollowUpDueAt = Date.now() + MINUTE_MS
  breakFollowUpTimer = setTimeout(() => {
    breakFollowUpTimer = null
    breakFollowUpDueAt = null
    if (breakReminderStartedAt === null || hasRecentMovement) return
    if (breakFollowUpResends >= MAX_BREAK_REMINDER_RESENDS && !breakFollowUpWarningShown) {
      console.warn(`No movement detected after ${MAX_BREAK_REMINDER_RESENDS} movement-break reminders; continuing to check.`)
      breakFollowUpWarningShown = true
    }
    sendMovementBreakNotification('resend-reminder')
    breakFollowUpResends += 1
    scheduleBreakFollowUp()
  }, MINUTE_MS)
}

function sendMovementBreakNotification(type = 'break-reminder') {
  sendSystemNotification(type, 'Time for a movement break', 'Stand up and move around for 8 minutes, then take a 2-minute walk before sitting back down.')
}

function scheduleNextCyclePhase() {
  if (cyclePhaseDueAt === null) return
  breakReminderTimer = setTimeout(() => {
    breakReminderTimer = null
    if (cyclePhase === 'work') {
      breakReminderDueAt = null
      sendMovementBreakNotification('break-reminder')
      breakFollowUpResends = 0
      breakFollowUpWarningShown = false
      scheduleBreakFollowUp()
      cyclePhase = 'walk'
      cyclePhaseDueAt = Date.now() + WALK_MODE_MS
    } else {
      if (breakFollowUpTimer !== null) clearTimeout(breakFollowUpTimer)
      breakFollowUpTimer = null
      breakFollowUpDueAt = null
      cyclePhase = 'work'
      cyclePhaseDueAt = Date.now() + WORK_MODE_MS
      breakReminderDueAt = cyclePhaseDueAt
      breakReminderIndex += 1
    }
    scheduleNextCyclePhase()
  }, Math.max(0, cyclePhaseDueAt - Date.now()))
}

function startBreakReminderSchedule() {
  // A fresh connection always starts in 20-minute work mode.
  stopBreakReminderSchedule()
  const now = Date.now()
  breakReminderStartedAt = now
  cyclePhase = 'work'
  cyclePhaseDueAt = now + WORK_MODE_MS
  breakReminderDueAt = cyclePhaseDueAt
  breakReminderIndex = 0
  scheduleNextCyclePhase()
}

function broadcastTelemetry(channel, payload) {
  for (const window of [mainWindow, trayPopup]) if (window && !window.isDestroyed()) window.webContents.send(channel, payload)
}

function updateTelemetryStatus(next) {
  telemetryStatus = { ...telemetryStatus, ...next }
  broadcastTelemetry('serial-status', { connected: telemetryStatus.listening === true, ...telemetryStatus })
}

function startSerialReader() {
  if (serialReader || !serialReaderRequested || !serialConfig.port) return
  updateTelemetryStatus({ state: 'connecting', listening: false, error: null, payloadError: null })
  const python = process.env.PYTHON_EXECUTABLE || (process.platform === 'win32' ? 'python' : 'python3')
  const script = path.join(__dirname, '..', '..', 'backend', 'serial_reader.py')
  serialReader = spawn(python, [script, '--port', serialConfig.port, '--json'], { cwd: path.join(__dirname, '..', '..'), env: process.env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
  let stdout = ''
  serialReader.stdout.setEncoding('utf8')
  serialReader.stdout.on('data', (chunk) => {
    stdout += chunk
    const lines = stdout.split(/\r?\n/)
    stdout = lines.pop()
    for (const line of lines) {
      try {
        const event = JSON.parse(line)
        if (event.type === 'telemetry') {
          const hasMovement = handleMovementReading(event)
          handlePostureAlert(event.binary)
          broadcastTelemetry('posture-data', {
            // Pass through the already-correct named mapping; no downstream reordering.
            neckX: event.neckX,
            neckY: event.neckY,
            lumbarX: event.lumbarX,
            lumbarY: event.lumbarY,
            binary: event.binary,
            hasRecentMovement: hasMovement,
            received_at: Date.now(),
          })
        }
        if (event.type === 'status') {
          if (event.listening && breakReminderStartedAt === null) startBreakReminderSchedule()
          if (!event.listening) {
            stopBreakReminderSchedule()
            resetMovementTracking()
            resetPostureAlertTracking()
          }
          updateTelemetryStatus({ ...event, state: event.listening ? 'connected' : 'disconnected' })
        }
        if (event.type === 'payload_error') updateTelemetryStatus({ payloadError: event.error })
      } catch (_) {}
    }
  })
  serialReader.stderr.on('data', () => {})
  serialReader.on('error', (error) => {
    stopBreakReminderSchedule()
    resetMovementTracking()
    resetPostureAlertTracking()
    updateTelemetryStatus({ state: 'error', listening: false, error: error.message })
  })
  serialReader.on('exit', (code) => {
    serialReader = null
    stopBreakReminderSchedule()
    resetMovementTracking()
    resetPostureAlertTracking()
    if (!isQuitting) updateTelemetryStatus({ state: serialReaderRequested ? 'error' : 'disconnected', listening: false, error: serialReaderRequested ? `Serial reader stopped (${code ?? 'unknown'})` : null })
  })
}

function stopSerialReader() {
  if (!serialReader) return Promise.resolve()
  const reader = serialReader
  return new Promise((resolve) => {
    let settled = false
    const cleanup = () => {
      reader.stdout?.removeAllListeners('data')
      reader.stderr?.removeAllListeners('data')
      reader.removeAllListeners('error')
      if (serialReader === reader) serialReader = null
    }
    const finish = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve()
    }
    reader.once('exit', finish)
    if (reader.stdin?.writable) reader.stdin.write('stop\n')
    setTimeout(() => {
      if (reader.exitCode === null) reader.kill()
      setTimeout(finish, 250)
    }, 3000)
  })
}

function listSerialPorts() {
  const python = process.env.PYTHON_EXECUTABLE || (process.platform === 'win32' ? 'python' : 'python3')
  const script = path.join(__dirname, '..', '..', 'backend', 'serial_reader.py')
  return new Promise((resolve) => {
    execFile(python, [script, '--list'], { cwd: path.join(__dirname, '..', '..'), windowsHide: true }, (error, stdout) => {
      if (error) return resolve({ ports: [], error: 'Unable to enumerate serial ports.' })
      try { resolve({ ports: JSON.parse(String(stdout)) }) } catch (_) { resolve({ ports: [], error: 'Unable to enumerate serial ports.' }) }
    })
  })
}

async function configureSerialReader(nextConfig) {
  const port = String(nextConfig?.port || '').trim()
  if (!port) return { ok: false, error: 'Enter a valid serial port, such as COM5 or /dev/ttyUSB0.' }
  serialConfig = { port }
  telemetryStatus = { state: 'disconnected', listening: false, port, error: null }
  serialReaderRequested = true
  await stopSerialReader()
  startSerialReader()
  return { ok: true }
}

const rendererEntry = () => isDevelopment
  ? 'http://localhost:5173'
  : `file://${path.join(__dirname, '..', '..', 'dist', 'index.html')}`

function createTrayImage(fileName) {
  const iconPath = path.join(__dirname, '..', '..', 'src', 'assets', fileName)
  return fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty()
}

function createMainWindow() {
  const appIconPath = path.join(__dirname, '..', '..', 'src', 'assets', 'icon.ico')
  mainWindow = new BrowserWindow({
    title: 'ISPA — Incorrect Posture Determination via Spine Alignment',
    width: 1080,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    show: false,
    skipTaskbar: false,
    icon: fs.existsSync(appIconPath) ? appIconPath : undefined,
    autoHideMenuBar: true,
    backgroundColor: '#0a060e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDevelopment) {
    mainWindow.loadURL(rendererEntry())
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'))
  }
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.on('select-bluetooth-device', (event, devices, callback) => {
    event.preventDefault()
    bluetoothSelectionCallback = callback
    mainWindow.webContents.send('bluetooth-devices', devices.map(({ deviceId, deviceName }) => ({ deviceId, deviceName })))
  })
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })
  mainWindow.on('closed', () => { mainWindow = null })
}

function createTrayPopup() {
  trayPopup = new BrowserWindow({
    width: 340,
    height: 430,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    show: false,
    frame: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: '#0a060e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDevelopment) trayPopup.loadURL(`${rendererEntry()}?view=tray`)
  else trayPopup.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'), { query: { view: 'tray' } })
  trayPopup.on('blur', () => trayPopup.hide())
  trayPopup.on('closed', () => { trayPopup = null })
}

function showTrayPopup() {
  if (!trayPopup || !tray) return
  const trayBounds = tray.getBounds()
  const popupBounds = trayPopup.getBounds()
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
  const x = Math.round(Math.min(Math.max(display.workArea.x, trayBounds.x - popupBounds.width / 2), display.workArea.x + display.workArea.width - popupBounds.width))
  const y = trayBounds.y < display.workArea.y + display.workArea.height / 2
    ? trayBounds.y + trayBounds.height + 8
    : trayBounds.y - popupBounds.height - 8
  trayPopup.setPosition(x, y, false)
  trayPopup.show()
  trayPopup.focus()
}

function openDashboard() {
  if (!mainWindow) createMainWindow()
  mainWindow.show()
  mainWindow.focus()
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: 'Open Dashboard', click: openDashboard },
    {
      label: monitoringPaused ? 'Resume Monitoring' : 'Pause Monitoring',
      click: () => {
        monitoringPaused = !monitoringPaused
        if (trayPopup && !trayPopup.isDestroyed()) trayPopup.webContents.send('monitoring-state-changed', monitoringPaused)
        if (tray) tray.setContextMenu(buildTrayMenu())
      },
    },
    { type: 'separator' },
    { label: 'Device & Settings', click: openDashboard },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit() } },
  ])
}

function createTray() {
  tray = new Tray(createTrayImage('tray-icon-32.png'))
  tray.setToolTip('ISPA')
  tray.setContextMenu(buildTrayMenu())
  tray.on('click', showTrayPopup)
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createMainWindow()
  createTrayPopup()
  createTray()

  ipcMain.handle('open-dashboard', openDashboard)
  ipcMain.handle('quit-app', () => { isQuitting = true; app.quit() })
  ipcMain.handle('get-monitoring-state', () => !monitoringPaused)
  ipcMain.handle('toggle-monitoring', () => {
    monitoringPaused = !monitoringPaused
    if (tray) tray.setContextMenu(buildTrayMenu())
    return !monitoringPaused
  })
  ipcMain.handle('select-bluetooth-device', (_event, deviceId) => {
    if (!bluetoothSelectionCallback) return false
    bluetoothSelectionCallback(deviceId)
    bluetoothSelectionCallback = null
    return true
  })
  ipcMain.handle('cancel-bluetooth-device', () => {
    if (bluetoothSelectionCallback) bluetoothSelectionCallback('')
    bluetoothSelectionCallback = null
  })
  ipcMain.handle('scan-wifi-networks', () => new Promise((resolve) => {
    execFile('netsh', ['wlan', 'show', 'networks', 'mode=bssid'], { windowsHide: true }, (error, stdout) => {
      if (error) return resolve({ networks: [], error: 'Wi‑Fi scanning is unavailable on this device.' })
      const networks = []
      let current = null
      String(stdout).split(/\r?\n/).forEach((line) => {
        const ssid = line.match(/^\s*SSID\s+\d+\s*:\s*(.*)$/i)
        if (ssid) {
          const name = ssid[1].trim()
          if (name) { current = { ssid: name, signal: null, security: 'Open' }; networks.push(current) }
        }
        const signal = line.match(/^\s*Signal\s*:\s*(\d+)%/i)
        if (signal && current) current.signal = Number(signal[1])
        const auth = line.match(/^\s*Authentication\s*:\s*(.*)$/i)
        if (auth && current) current.security = auth[1].trim()
      })
      resolve({ networks: networks.filter((network, index, list) => list.findIndex((item) => item.ssid === network.ssid) === index) })
    })
  }))
  ipcMain.handle('connect-wifi-network', (_event, ssid) => new Promise((resolve) => {
    execFile('netsh', ['wlan', 'connect', `name=${ssid}`], { windowsHide: true }, (error, stdout, stderr) => resolve({ connected: !error, message: String(stdout || stderr).trim() }))
  }))
  ipcMain.handle('set-launch-on-startup', (_event, enabled) => {
    app.setLoginItemSettings({ openAtLogin: Boolean(enabled) })
    return app.getLoginItemSettings().openAtLogin
  })
  ipcMain.handle('get-launch-on-startup', () => app.getLoginItemSettings().openAtLogin)
  ipcMain.handle('get-telemetry-status', () => telemetryStatus)
  ipcMain.handle('get-notification-log', (event) => {
    event.sender.send('notification-log-init', notificationLog)
    return notificationLog
  })
  ipcMain.handle('get-break-timer-state', (event) => {
    const state = getBreakTimerState()
    event.sender.send('break-timer-state', state)
    return state
  })
  ipcMain.handle('test-notification', () => {
    const shown = sendSystemNotification(
      'test-notification',
      'ISPA Test Notification',
      'Native Windows notifications are working.',
      { log: false },
    )
    return shown
      ? { ok: true }
      : { ok: false, error: 'Electron reports that native notifications are unsupported or disabled.' }
  })
  ipcMain.handle('list-serial-ports', () => listSerialPorts())
  ipcMain.handle('configure-serial', (_event, config) => configureSerialReader(config))
  ipcMain.handle('connect-serial', () => { serialReaderRequested = true; startSerialReader(); return true })
  ipcMain.handle('disconnect-serial', async () => { serialReaderRequested = false; stopBreakReminderSchedule(); resetMovementTracking(); resetPostureAlertTracking(); await stopSerialReader(); updateTelemetryStatus({ state: 'disconnected', listening: false, error: null }); return true })

  app.on('activate', openDashboard)
  console.log('Notifications supported:', Notification.isSupported())
  if (!Notification.isSupported()) {
    console.warn('Native notifications are unavailable. Test a packaged/installed build and check Windows notification policy.')
  }
  startTimerStateBroadcast()
})

app.on('window-all-closed', (event) => {
  event.preventDefault()
})

app.on('before-quit', () => { isQuitting = true; stopBreakReminderSchedule(); resetMovementTracking(); resetPostureAlertTracking(); stopTimerStateBroadcast(); stopSerialReader() })

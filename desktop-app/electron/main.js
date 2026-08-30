const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, screen } = require('electron')
const { execFile, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-gpu-compositing')
app.commandLine.appendSwitch('in-process-gpu')

let mainWindow
let trayPopup
let tray
let isQuitting = false
let monitoringPaused = false
let bluetoothSelectionCallback = null
let mqttBridge = null
let telemetryStatus = { listening: false, host: '127.0.0.1', port: 1883, error: null }
const isDevelopment = process.env.ISPA_DEV === '1'

function broadcastTelemetry(channel, payload) {
  for (const window of [mainWindow, trayPopup]) if (window && !window.isDestroyed()) window.webContents.send(channel, payload)
}

function updateTelemetryStatus(next) {
  telemetryStatus = { ...telemetryStatus, ...next }
  broadcastTelemetry('telemetry-status', telemetryStatus)
}

function startMqttBridge() {
  if (mqttBridge) return
  const python = process.env.PYTHON_EXECUTABLE || (process.platform === 'win32' ? 'python' : 'python3')
  const script = path.join(__dirname, '..', '..', 'backend', 'mqtt_bridge.py')
  mqttBridge = spawn(python, [script], { cwd: path.join(__dirname, '..', '..'), env: process.env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
  let stdout = ''
  mqttBridge.stdout.setEncoding('utf8')
  mqttBridge.stdout.on('data', (chunk) => {
    stdout += chunk
    const lines = stdout.split(/\r?\n/)
    stdout = lines.pop()
    for (const line of lines) {
      try {
        const event = JSON.parse(line)
        if (event.type === 'telemetry') broadcastTelemetry('telemetry', event)
        if (event.type === 'status') updateTelemetryStatus(event)
      } catch (_) {}
    }
  })
  mqttBridge.stderr.on('data', () => {})
  mqttBridge.on('error', (error) => updateTelemetryStatus({ listening: false, error: error.message }))
  mqttBridge.on('exit', (code) => {
    mqttBridge = null
    if (!isQuitting) updateTelemetryStatus({ listening: false, error: `MQTT bridge stopped (${code ?? 'unknown'})` })
  })
}

function sendCloseLidCommand(deviceId) {
  if (!mqttBridge?.stdin?.writable || !deviceId) return false
  mqttBridge.stdin.write(`${JSON.stringify({ type: 'close_lid', device_id: deviceId })}\n`)
  return true
}

function stopMqttBridge() {
  if (!mqttBridge) return
  mqttBridge.stdin.end()
  const bridge = mqttBridge
  setTimeout(() => { if (bridge.exitCode === null) bridge.kill() }, 3000)
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
  startMqttBridge()

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
  ipcMain.handle('send-close-lid-command', (_event, deviceId) => sendCloseLidCommand(deviceId))

  app.on('activate', openDashboard)
})

app.on('window-all-closed', (event) => {
  event.preventDefault()
})

app.on('before-quit', () => { isQuitting = true; stopMqttBridge() })

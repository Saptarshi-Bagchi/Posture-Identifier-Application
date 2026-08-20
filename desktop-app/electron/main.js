const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, screen } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow
let trayPopup
let tray
let isQuitting = false
let monitoringPaused = false

const dashboardUrl = () => `file://${path.join(__dirname, '..', 'dist', 'index.html')}`

function createTrayImage(fileName) {
  const iconPath = path.join(__dirname, '..', 'assets', fileName)
  return fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty()
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0b111b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadURL(dashboardUrl())
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
    backgroundColor: '#0b111b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  trayPopup.loadURL(`${dashboardUrl()}?view=tray`)
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
    { label: 'Settings', click: openDashboard },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit() } },
  ])
}

function createTray() {
  tray = new Tray(createTrayImage('tray-icon.png'))
  tray.setToolTip('PostureGuard')
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
  ipcMain.handle('set-launch-on-startup', (_event, enabled) => {
    app.setLoginItemSettings({ openAtLogin: Boolean(enabled) })
    return app.getLoginItemSettings().openAtLogin
  })
  ipcMain.handle('get-launch-on-startup', () => app.getLoginItemSettings().openAtLogin)

  app.on('activate', openDashboard)
})

app.on('window-all-closed', (event) => {
  event.preventDefault()
})

app.on('before-quit', () => { isQuitting = true })

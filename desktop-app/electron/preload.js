// ------------------------- IMPORTS -------------------------
const { contextBridge, ipcRenderer } = require('electron')

// ------------------------- EXPOSED ELECTRON API -------------------------
contextBridge.exposeInMainWorld('electronAPI', {
  openDashboard: () => ipcRenderer.invoke('open-dashboard'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  getMonitoringState: () => ipcRenderer.invoke('get-monitoring-state'),
  toggleMonitoring: () => ipcRenderer.invoke('toggle-monitoring'),
  selectBluetoothDevice: (deviceId) => ipcRenderer.invoke('select-bluetooth-device', deviceId),
  cancelBluetoothDevice: () => ipcRenderer.invoke('cancel-bluetooth-device'),
  scanWifiNetworks: () => ipcRenderer.invoke('scan-wifi-networks'),
  connectWifiNetwork: (ssid) => ipcRenderer.invoke('connect-wifi-network', ssid),
  setLaunchOnStartup: (enabled) => ipcRenderer.invoke('set-launch-on-startup', enabled),
  getLaunchOnStartup: () => ipcRenderer.invoke('get-launch-on-startup'),
  getTelemetryStatus: () => ipcRenderer.invoke('get-telemetry-status'),
  getNotificationLog: () => ipcRenderer.invoke('get-notification-log'),
  getBreakTimerState: () => ipcRenderer.invoke('get-break-timer-state'),
  testNotification: () => ipcRenderer.invoke('test-notification'),
  listSerialPorts: () => ipcRenderer.invoke('list-serial-ports'),
  configureSerial: (config) => ipcRenderer.invoke('configure-serial', config),
  connectSerial: () => ipcRenderer.invoke('connect-serial'),
  disconnectSerial: () => ipcRenderer.invoke('disconnect-serial'),
  onMonitoringStateChanged: (callback) => {
    const listener = (_event, paused) => callback(!paused)
    ipcRenderer.on('monitoring-state-changed', listener)
    return () => ipcRenderer.removeListener('monitoring-state-changed', listener)
  },
  onBluetoothDevices: (callback) => {
    const listener = (_event, devices) => callback(devices)
    ipcRenderer.on('bluetooth-devices', listener)
    return () => ipcRenderer.removeListener('bluetooth-devices', listener)
  },
  onPostureData: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('posture-data', listener)
    return () => ipcRenderer.removeListener('posture-data', listener)
  },
  onSerialStatus: (callback) => {
    const listener = (_event, status) => callback(status)
    ipcRenderer.on('serial-status', listener)
    return () => ipcRenderer.removeListener('serial-status', listener)
  },
  onNotificationLogUpdate: (callback) => {
    const listener = (_event, entry) => callback(entry)
    ipcRenderer.on('notification-log-update', listener)
    return () => ipcRenderer.removeListener('notification-log-update', listener)
  },
  onNotificationLogInit: (callback) => {
    const listener = (_event, entries) => callback(entries)
    ipcRenderer.on('notification-log-init', listener)
    return () => ipcRenderer.removeListener('notification-log-init', listener)
  },
  onBreakTimerState: (callback) => {
    const listener = (_event, state) => callback(state)
    ipcRenderer.on('break-timer-state', listener)
    return () => ipcRenderer.removeListener('break-timer-state', listener)
  },
})

const { contextBridge, ipcRenderer } = require('electron')

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
  configureMqtt: (config) => ipcRenderer.invoke('configure-mqtt', config),
  connectMqtt: () => ipcRenderer.invoke('connect-mqtt'),
  disconnectMqtt: () => ipcRenderer.invoke('disconnect-mqtt'),
  sendCloseLidCommand: (deviceId) => ipcRenderer.invoke('send-close-lid-command', deviceId),
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
  onTelemetry: (callback) => {
    const listener = (_event, telemetry) => callback(telemetry)
    ipcRenderer.on('telemetry', listener)
    return () => ipcRenderer.removeListener('telemetry', listener)
  },
  onTelemetryStatus: (callback) => {
    const listener = (_event, status) => callback(status)
    ipcRenderer.on('telemetry-status', listener)
    return () => ipcRenderer.removeListener('telemetry-status', listener)
  },
})

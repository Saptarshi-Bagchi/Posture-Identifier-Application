const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openDashboard: () => ipcRenderer.invoke('open-dashboard'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  getMonitoringState: () => ipcRenderer.invoke('get-monitoring-state'),
  toggleMonitoring: () => ipcRenderer.invoke('toggle-monitoring'),
  selectBluetoothDevice: (deviceId) => ipcRenderer.invoke('select-bluetooth-device', deviceId),
  cancelBluetoothDevice: () => ipcRenderer.invoke('cancel-bluetooth-device'),
  setLaunchOnStartup: (enabled) => ipcRenderer.invoke('set-launch-on-startup', enabled),
  getLaunchOnStartup: () => ipcRenderer.invoke('get-launch-on-startup'),
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
})

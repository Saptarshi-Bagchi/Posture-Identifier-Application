import { useEffect, useState } from 'react'
import { Icon } from '../../dashboard/Icon'

const steps = [['01', 'Wake your ESP32', 'Power it on and keep it within 3 metres of this computer.'], ['02', 'Pair over Bluetooth', 'Choose your PostureGuard sensor from the available devices.'], ['03', 'Start the stream', 'Begin sending posture readings to live monitoring.']]

export default function ConnectDevicePage({ device, onConnectionChange, onNavigate }) {
  const [phase, setPhase] = useState(device.connected ? 'connected' : 'idle')
  const [streaming, setStreaming] = useState(false)
  const [lastPacket, setLastPacket] = useState('No data received yet')
  const [availableDevices, setAvailableDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [scanError, setScanError] = useState('')
  const scanning = phase === 'scanning'
  const connected = phase === 'connected'
  useEffect(() => window.electronAPI?.onBluetoothDevices?.((devices) => {
    setAvailableDevices(devices)
    setPhase('found')
  }), [])

  async function findDevice() {
    setSelectedDevice(null)
    setAvailableDevices([])
    setScanError('')
    setPhase('scanning')
    if (window.electronAPI?.onBluetoothDevices && navigator.bluetooth) {
      try {
        await navigator.bluetooth.requestDevice({ acceptAllDevices: true })
      } catch {
        setPhase('idle')
      }
      return
    }
    setScanError('Bluetooth discovery is available in the PostureGuard desktop app. Open this screen there to scan nearby devices.')
    setPhase('idle')
  }
  async function chooseDevice(bluetoothDevice) {
    setSelectedDevice(bluetoothDevice)
    if (window.electronAPI?.selectBluetoothDevice) await window.electronAPI.selectBluetoothDevice(bluetoothDevice.deviceId)
  }
  function connect() { setPhase('connected'); onConnectionChange(true) }
  function startTransfer() { setStreaming(true); setLastPacket('IMU packet received · Neck 8° · Upper back 14° · Lower back 21°') }
  function disconnect() { setStreaming(false); setPhase('idle'); setLastPacket('No data received yet'); onConnectionChange(false) }
  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">Bluetooth connection</p><h1 className="mt-1 text-3xl font-bold">Connect your ESP32</h1><p className="mt-2 max-w-xl text-sm text-[#8eb69b]">Pair your PostureGuard sensor, then start a secure stream of posture readings to this computer.</p></div><span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${streaming ? 'bg-emerald-400/10 text-emerald-300' : connected ? 'bg-[#8eb69b]/15 text-[#8eb69b]' : 'bg-[#163832] text-[#8eb69b]'}`}><span className={`h-2 w-2 rounded-full ${streaming ? 'animate-pulse bg-emerald-400' : connected ? 'bg-[#8eb69b]' : 'bg-slate-400'}`} />{streaming ? 'Receiving live data' : connected ? 'Paired · ready to transfer' : 'Not connected'}</span></div>
    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><section className="overflow-hidden rounded-3xl border border-[#235347] bg-[#0b2b26] shadow-xl shadow-black/10"><div className="border-b border-[#235347] bg-[#163832] px-6 py-5 sm:px-7"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8eb69b] text-[#051f20]"><Icon name="bluetooth" size={23} /></span><div><p className="font-bold">ESP32 posture sensor</p><p className="mt-1 text-xs text-[#8eb69b]">Bluetooth Low Energy · encrypted connection</p></div></div>{connected && <span className="text-xs font-bold text-emerald-300">Connected</span>}</div></div><div className="p-6 sm:p-7">
      {phase === 'idle' && <div className="py-7 text-center"><span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#8eb69b]/40 bg-[#163832] text-[#8eb69b]"><Icon name="bluetooth" size={42} /></span><h2 className="mt-6 text-xl font-bold">Ready to find your sensor</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#8eb69b]">Turn on your ESP32 and make sure Bluetooth is enabled on this computer.</p>{scanError && <p className="mx-auto mt-4 max-w-md rounded-xl bg-red-400/10 px-3 py-2 text-xs leading-5 text-red-300">{scanError}</p>}<button type="button" onClick={findDevice} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#8eb69b] px-5 py-3 text-sm font-bold text-[#051f20]"><Icon name="bluetooth" size={17} />Find ESP32</button></div>}
      {scanning && <div className="py-10 text-center"><span className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-[#8eb69b]/15 text-[#8eb69b]"><Icon name="bluetooth" size={36} /></span><h2 className="mt-5 text-xl font-bold">Searching nearby devices…</h2><p className="mt-2 text-sm text-[#8eb69b]">Looking for PostureGuard sensors over Bluetooth.</p></div>}
      {phase === 'found' && <div><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">Available Bluetooth devices</p><p className="mt-1 text-xs text-[#8eb69b]">Select your ESP32 to continue pairing.</p></div><button type="button" onClick={findDevice} className="text-xs font-semibold text-[#8eb69b] hover:underline">Scan again</button></div><div className="mt-4 space-y-3">{availableDevices.map((bluetoothDevice) => <button key={bluetoothDevice.deviceId} type="button" onClick={() => chooseDevice(bluetoothDevice)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${selectedDevice?.deviceId === bluetoothDevice.deviceId ? 'border-[#8eb69b] bg-[#163832]' : 'border-[#235347] bg-[#051f20] hover:bg-[#163832]'}`}><span className="rounded-xl bg-[#8eb69b]/15 p-3 text-[#8eb69b]"><Icon name="bluetooth" size={21} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{bluetoothDevice.deviceName || 'Unnamed Bluetooth device'}</span><span className="mt-1 block text-xs text-[#8eb69b]">{bluetoothDevice.deviceId}</span></span>{selectedDevice?.deviceId === bluetoothDevice.deviceId && <Icon name="check" size={19} />}</button>)}</div>{selectedDevice && <button type="button" onClick={connect} className="mt-5 w-full rounded-xl bg-[#8eb69b] px-5 py-3 text-sm font-bold text-[#051f20]">Pair {selectedDevice.deviceName || 'selected device'}</button>}</div>}
      {connected && <div className="space-y-5"><div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-4"><span className="rounded-xl bg-emerald-400/15 p-2 text-emerald-300"><Icon name="check" size={21} /></span><div><p className="text-sm font-bold">{streaming ? 'Data transfer is active' : 'Your ESP32 is paired'}</p><p className="mt-1 text-xs text-[#8eb69b]">{streaming ? 'Readings are being sent to PostureGuard.' : 'Start the stream when you are ready to monitor.'}</p></div></div><div className="grid gap-3 sm:grid-cols-3">{[['Battery', `${device.battery}%`, 'chart'], ['Signal', `${device.signal}%`, 'live'], ['Protocol', 'BLE', 'bluetooth']].map(([label, value, icon]) => <div key={label} className="rounded-xl border border-[#235347] bg-[#051f20] p-3"><Icon name={icon} size={16} /><p className="mt-3 text-xs text-[#8eb69b]">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>)}</div><div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={startTransfer} disabled={streaming} className="flex-1 rounded-xl bg-[#8eb69b] px-5 py-3 text-sm font-bold text-[#051f20] disabled:cursor-default disabled:opacity-70">{streaming ? 'Data transfer running' : 'Start data transfer'}</button><button type="button" onClick={disconnect} className="rounded-xl border border-[#8eb69b] px-5 py-3 text-sm font-bold">Disconnect</button></div>{streaming && <button type="button" onClick={() => onNavigate('Live Monitoring')} className="w-full text-center text-xs font-bold text-[#8eb69b] hover:underline">Open live monitoring →</button>}</div>}
    </div></section><div className="space-y-6"><section className="rounded-3xl border border-[#235347] bg-[#0b2b26] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">Transfer preview</p><div className="mt-4 rounded-2xl border border-[#235347] bg-[#051f20] p-4"><div className="flex items-center justify-between"><span className="text-xs text-[#8eb69b]">Latest packet</span><span className={`h-2 w-2 rounded-full ${streaming ? 'animate-pulse bg-emerald-400' : 'bg-slate-500'}`} /></div><p className="mt-3 text-sm font-medium leading-6">{lastPacket}</p></div><p className="mt-4 text-xs leading-5 text-[#8eb69b]">Only posture telemetry is transmitted. Your sensor data stays on this device unless you export it.</p></section><section className="rounded-3xl border border-[#235347] bg-[#0b2b26] p-6"><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">How it works</p><div className="mt-5 space-y-5">{steps.map(([number, title, copy]) => <div key={number} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#163832] text-[10px] font-bold text-[#8eb69b]">{number}</span><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-[#8eb69b]">{copy}</p></div></div>)}</div></section></div></div>
  </div>
}

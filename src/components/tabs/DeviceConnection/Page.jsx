import { useEffect, useState } from 'react'
import { card, SectionTitle } from '../../posturesync/Shared'

const storageKey = 'ispa-serial-settings'

export default function DeviceConnectionPage({ telemetryStatus }) {
  const [port, setPort] = useState(() => JSON.parse(localStorage.getItem(storageKey) || '{}').port || '')
  const [ports, setPorts] = useState([])
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [actionError, setActionError] = useState('')

  const refreshPorts = async () => {
    const result = await window.electronAPI?.listSerialPorts?.()
    if (result?.error) setActionError(result.error)
    setPorts(result?.ports || [])
    return result?.ports || []
  }

  useEffect(() => { refreshPorts() }, [])
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify({ port })) }, [port])
  useEffect(() => {
    if (telemetryStatus?.connected === false || telemetryStatus?.listening === false) {
      setDisconnecting(false)
      setPort('')
      setPorts([])
      refreshPorts()
    }
  }, [telemetryStatus?.connected, telemetryStatus?.listening])

  const connect = async () => {
    setConnecting(true); setActionError('')
    const available = await refreshPorts()
    if (!port || !available.includes(port)) {
      setActionError('Select an available serial port before connecting.')
      setConnecting(false)
      return
    }
    const result = await window.electronAPI?.configureSerial?.({ port })
    if (!result?.ok) setActionError(result?.error || 'Unable to start the serial reader.')
    setConnecting(false)
  }

  const disconnect = async () => {
    setDisconnecting(true); setActionError('')
    await window.electronAPI?.disconnectSerial?.()
    // The main process confirms closure through serial-status; this is only a fallback.
    window.setTimeout(() => setDisconnecting(false), 3500)
  }

  const connected = telemetryStatus?.connected ?? telemetryStatus?.listening === true
  const state = disconnecting ? 'Disconnecting' : connecting ? 'Connecting' : telemetryStatus?.error ? 'Error' : connected ? 'Connected' : 'Disconnected'
  const stateClass = state === 'Connected' ? 'text-emerald-300 bg-emerald-400/10' : state === 'Error' ? 'text-red-300 bg-red-400/10' : 'text-amber-300 bg-amber-300/10'

  return <div className="mx-auto max-w-3xl space-y-6"><div><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">Serial</p><h1 className="mt-1 text-2xl font-bold">Device Connection</h1><p className="mt-2 text-sm text-[#8eb69b]">Connect directly to the ESP8266 over USB at 115200 baud.</p></div><section className={card}><div className="flex items-center justify-between"><SectionTitle eyebrow="Connection status" title={state} /><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${stateClass}`}>{state}</span></div>{(actionError || telemetryStatus?.error) && <p className="mb-5 rounded-xl bg-red-400/10 px-3 py-2 text-sm text-red-300">{actionError || telemetryStatus.error}</p>}<label className="block text-xs font-semibold text-slate-400">Serial port<select value={port} onChange={(event) => setPort(event.target.value)} disabled={connecting || disconnecting} className="mt-2 w-full rounded-xl border border-brand-border bg-brand-navy px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-brand-cyan"><option value="">Select an available port</option>{ports.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><div className="mt-5 flex gap-3"><button type="button" onClick={connect} disabled={connecting || disconnecting || connected} className="rounded-xl bg-[#8eb69b] px-5 py-3 text-sm font-bold text-[#051f20] disabled:opacity-50">{connecting ? 'Connecting…' : 'Connect'}</button><button type="button" onClick={disconnect} disabled={disconnecting || !connected} className="rounded-xl border border-[#8eb69b] px-5 py-3 text-sm font-bold disabled:opacity-50">{disconnecting ? 'Disconnecting…' : 'Disconnect'}</button><button type="button" onClick={refreshPorts} disabled={connecting || disconnecting} className="rounded-xl border border-[#8eb69b] px-5 py-3 text-sm font-bold disabled:opacity-50">Refresh ports</button></div></section></div>
}

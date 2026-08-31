import { useEffect, useState } from 'react'
import { card, MockInput, SectionTitle } from '../../posturesync/Shared'

const storageKey = 'ispa-mqtt-settings'
const defaults = { host: '127.0.0.1', port: '1883', username: 'device', password: '', topic: 'posture/sensor_data' }

export default function DeviceConnectionPage({ telemetryStatus }) {
  const [settings, setSettings] = useState(() => ({ ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }))
  const [connecting, setConnecting] = useState(false)
  const [actionError, setActionError] = useState('')
  useEffect(() => localStorage.setItem(storageKey, JSON.stringify(settings)), [settings])
  const update = (key) => (event) => setSettings((current) => ({ ...current, [key]: event.target.value }))
  const connect = async () => {
    setConnecting(true); setActionError('')
    const result = await window.electronAPI?.configureMqtt?.(settings)
    if (!result?.ok) setActionError(result?.error || 'Unable to start MQTT.')
    setConnecting(false)
  }
  const disconnect = async () => { setActionError(''); await window.electronAPI?.disconnectMqtt?.() }
  const state = connecting ? 'Connecting' : telemetryStatus?.error ? 'Error' : telemetryStatus?.listening ? 'Connected' : 'Disconnected'
  const stateClass = state === 'Connected' ? 'text-emerald-300 bg-emerald-400/10' : state === 'Error' ? 'text-red-300 bg-red-400/10' : 'text-amber-300 bg-amber-300/10'
  return <div className="mx-auto max-w-3xl space-y-6"><div><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">MQTT</p><h1 className="mt-1 text-2xl font-bold">Device Connection</h1><p className="mt-2 text-sm text-[#8eb69b]">Broker settings are stored only on this device.</p></div><section className={card}><div className="flex items-center justify-between"><SectionTitle eyebrow="Connection status" title={state} /><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${stateClass}`}>{state}</span></div>{(actionError || telemetryStatus?.error || telemetryStatus?.payloadError) && <p className="mb-5 rounded-xl bg-red-400/10 px-3 py-2 text-sm text-red-300">{actionError || telemetryStatus?.payloadError || telemetryStatus?.error}</p>}<div className="grid gap-5 sm:grid-cols-2"><MockInput label="Broker host" value={settings.host} onChange={update('host')} /><MockInput label="Port" value={settings.port} onChange={update('port')} /><MockInput label="Username (optional on loopback)" value={settings.username} onChange={update('username')} /><MockInput label="Password (required for LAN bind)" type="password" value={settings.password} onChange={update('password')} /></div><div className="mt-5"><MockInput label="Telemetry topic" value={settings.topic} onChange={update('topic')} /></div><p className="mt-3 text-xs text-[#8eb69b]">Expected JSON: neck_x, neck_y, lumbar_x, lumbar_y. Four-value CSV is also accepted.</p><div className="mt-5 flex gap-3"><button type="button" onClick={connect} disabled={connecting} className="rounded-xl bg-[#8eb69b] px-5 py-3 text-sm font-bold text-[#051f20] disabled:opacity-50">{connecting ? 'Connecting…' : 'Connect'}</button><button type="button" onClick={disconnect} className="rounded-xl border border-[#8eb69b] px-5 py-3 text-sm font-bold">Disconnect</button></div></section></div>
}

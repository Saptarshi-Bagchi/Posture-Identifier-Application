import { useEffect, useState } from 'react'
import { card, SectionTitle } from '../../posturesync/Shared'

const displayTimestamp = (timestamp) => timestamp ? new Date(timestamp).toLocaleString() : '—'

export default function LiveDataPage({ telemetry, onNavigate }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  const updatedAt = telemetry?.received_at ? new Date(telemetry.received_at).getTime() : 0
  const stale = !updatedAt || now - updatedAt > 5000
  const sendCloseLid = async () => { if (telemetry?.device_id) await window.electronAPI?.sendCloseLidCommand?.(telemetry.device_id) }
  const metrics = [
    ['Posture state', telemetry?.posture_state ?? '—'],
    ['Angle', Number.isFinite(telemetry?.angle) ? `${telemetry.angle.toFixed(1)}°` : '—'],
    ['Last updated', displayTimestamp(telemetry?.received_at)],
    ['Status', stale ? 'Stale' : 'Live'],
  ]
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">MQTT telemetry</p><h1 className="mt-1 text-2xl font-bold">Live Data</h1><p className="mt-2 text-sm text-[#8eb69b]">Latest telemetry is updated in place for the active device.</p></div><button type="button" onClick={() => onNavigate('Device & Settings')} className="rounded-xl border border-[#8eb69b] px-4 py-2.5 text-xs font-bold">MQTT connection</button></div><section className={card}><SectionTitle eyebrow={telemetry?.device_id ? `Device · ${telemetry.device_id}` : 'Device'} title="Current telemetry" action={<span className={`rounded-full px-3 py-1.5 text-xs font-bold ${stale ? 'bg-amber-300/10 text-amber-300' : 'bg-emerald-400/10 text-emerald-300'}`}>{stale ? 'STALE · 5s+' : 'LIVE'}</span>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <div key={label} className="rounded-xl border border-[#235347] bg-[#051f20] p-4"><p className="text-xs text-[#8eb69b]">{label}</p><p className="mt-2 break-words text-lg font-bold">{value}</p></div>)}</div><button type="button" disabled={!telemetry?.device_id} onClick={sendCloseLid} className="mt-5 rounded-xl bg-[#8eb69b] px-4 py-3 text-xs font-bold text-[#051f20] disabled:cursor-not-allowed disabled:opacity-50">Send close_lid command</button></section></div>
}

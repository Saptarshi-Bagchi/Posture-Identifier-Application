import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import correctPosture from '../../../assets/postures/neutral_posture.jpg'
import { card, SectionTitle } from '../../posturesync/Shared'

const axes = [['neck_x', 'Neck X', '#8eb69b'], ['neck_y', 'Neck Y', '#fbbf24'], ['lumbar_x', 'Lumbar X', '#60a5fa'], ['lumbar_y', 'Lumbar Y', '#f472b6']]

function AxisChart({ axis, label, color, history }) {
  return <div className="min-h-0 rounded-xl border border-[#235347] bg-[#051f20] p-3"><p className="text-xs font-bold text-[#8eb69b]">{label}</p><div className="mt-2 h-28"><ResponsiveContainer width="100%" height="100%"><LineChart data={history}><XAxis dataKey="time" hide /><YAxis hide domain={['auto', 'auto']} /><Tooltip contentStyle={{ background: '#163832', border: '1px solid #235347' }} /><Line type="monotone" dataKey={axis} stroke={color} dot={false} strokeWidth={1.5} /></LineChart></ResponsiveContainer></div></div>
}

export default function LiveDataPage({ telemetry, history, classification, goodPosture }) {
  const updated = telemetry?.received_at || telemetry?.timestamp
  const statusLabel = goodPosture === null ? 'Waiting' : goodPosture ? 'Good posture' : 'Correction needed'
  const statusStyle = goodPosture === null ? 'bg-[#235347] text-[#8eb69b]' : goodPosture ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'
  return <div className="grid h-[calc(100vh-10rem)] min-h-[680px] grid-rows-[minmax(260px,0.85fr)_minmax(360px,1.15fr)] gap-5"><div className="grid min-h-0 gap-5 md:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]"><section className={`${card} flex min-h-0 items-center justify-center overflow-hidden`}><img src={correctPosture} alt="Correct posture reference" className="h-64 w-full object-contain" /></section><section className={`${card} min-h-0 overflow-hidden`}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">Live posture</p><h1 className="mt-1 text-2xl font-bold">{classification?.label || 'Waiting for data'}</h1><p className="mt-2 text-sm text-[#8eb69b]">{updated ? `Updated ${new Date(updated).toLocaleTimeString()}` : 'Waiting for MQTT message.'}</p></div><span className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${statusStyle}`}>{statusLabel}</span></div><div className="mt-6 grid grid-cols-2 gap-3">{axes.map(([key, label]) => <div key={key} className="rounded-xl border border-[#235347] bg-[#051f20] p-3"><p className="text-xs text-[#8eb69b]">{label}</p><p className="mt-2 text-xl font-bold">{Number.isFinite(telemetry?.[key]) ? telemetry[key].toFixed(2) : '—'}</p></div>)}</div></section></div><section className={`${card} min-h-0 overflow-hidden`}><SectionTitle eyebrow="Rolling window" title="Sensor history" />{history.length ? <div className="grid h-[calc(100%-3rem)] min-h-0 grid-cols-1 gap-3 sm:grid-cols-2">{axes.map(([axis, label, color]) => <AxisChart key={axis} axis={axis} label={label} color={color} history={history} />)}</div> : <div className="flex h-32 items-center justify-center text-sm text-[#8eb69b]">Waiting for data…</div>}</section></div>
}

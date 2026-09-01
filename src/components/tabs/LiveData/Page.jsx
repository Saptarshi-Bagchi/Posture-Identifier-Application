import { useEffect, useRef, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import correctPosture from '../../../assets/postures/neutral_posture.jpg'
import { card, SectionTitle } from '../../posturesync/Shared'

const axes = [['neck_x', 'Neck X', '#8eb69b'], ['neck_y', 'Neck Y', '#fbbf24'], ['lumbar_x', 'Lumbar X', '#60a5fa'], ['lumbar_y', 'Lumbar Y', '#f472b6']]

function useSlidingMotion(history) {
  const chartRef = useRef(null)
  const previousTimestamp = useRef(null)
  const averageInterval = useRef(1000)
  const timeoutRef = useRef(null)
  const rafRef = useRef(null)
  const [motion, setMotion] = useState({ active: false, duration: 1000, offset: 0 })

  useEffect(() => () => {
    window.clearTimeout(timeoutRef.current)
    window.cancelAnimationFrame(rafRef.current)
  }, [])
  useEffect(() => {
    const latest = history[history.length - 1]?.timestamp
    if (!latest || latest === previousTimestamp.current) return
    if (previousTimestamp.current !== null && history.length >= 2) {
      const interval = latest - previousTimestamp.current
      if (interval > 0) averageInterval.current = averageInterval.current * 0.8 + Math.min(interval, 5000) * 0.2
    }
    previousTimestamp.current = latest
    if (history.length < 2) return
    const width = chartRef.current?.clientWidth || 0
    const distance = width / Math.max(history.length - 1, 1)
    const duration = Math.max(120, Math.min(averageInterval.current, 5000))
    window.clearTimeout(timeoutRef.current)
    window.cancelAnimationFrame(rafRef.current)
    setMotion({ active: true, duration, offset: distance })
    rafRef.current = window.requestAnimationFrame(() => setMotion((current) => ({ ...current, offset: 0 })))
    timeoutRef.current = window.setTimeout(() => setMotion((current) => ({ ...current, active: false })), duration)
  }, [history])

  return { chartRef, motion }
}

function AxisChart({ axis, label, color, history }) {
  const firstTimestamp = history[0]?.timestamp
  const latestTimestamp = history[history.length - 1]?.timestamp
  const span = Math.max((latestTimestamp || 0) - (firstTimestamp || 0), 1000)
  const domain = latestTimestamp ? [latestTimestamp - span, latestTimestamp] : ['auto', 'auto']
  const { chartRef, motion } = useSlidingMotion(history)
  const motionClass = motion.active ? motion.offset ? 'is-sliding-start' : 'is-sliding' : ''
  return <div ref={chartRef} className={`live-axis-chart ${motionClass} flex min-h-[240px] min-w-0 flex-col rounded-xl border border-[#235347] bg-[#051f20] p-4`} style={{ '--slide-duration': `${motion.duration}ms`, '--slide-offset': `${motion.offset}px` }}>{/* Recharts animation is disabled; this transform provides the scrolling motion. */}<p className="shrink-0 text-xs font-bold text-[#8eb69b]">{label}</p><div className="mt-3 min-h-0 min-w-0 flex-1">{history.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={history} margin={{ top: 12, right: 28, bottom: 24, left: 34 }}><XAxis dataKey="timestamp" type="number" domain={domain} height={24} tick={{ fontSize: 10 }} tickMargin={8} minTickGap={12} tickFormatter={(value) => new Date(value).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })} /><YAxis width={42} domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickMargin={8} /><Tooltip labelFormatter={(value) => new Date(value).toLocaleTimeString()} contentStyle={{ background: '#163832', border: '1px solid #235347' }} /><Line type="monotone" dataKey={axis} stroke={color} dot={false} strokeWidth={1.5} isAnimationActive={false} /></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-xs text-[#8eb69b]">Waiting for data...</div>}</div></div>
}

export default function LiveDataPage({ telemetry, history, classification, goodPosture, telemetryStatus }) {
  const updated = telemetry?.received_at || telemetry?.timestamp
  const statusLabel = goodPosture === null ? 'Waiting...' : goodPosture ? 'Good' : 'Needs Correction'
  const statusStyle = goodPosture === null ? 'live-status-waiting' : goodPosture ? 'live-status-good' : 'live-status-bad'
  const connected = telemetryStatus?.connected ?? telemetryStatus?.listening === true
  return <div className="live-posture-scroll flex h-full min-h-0 flex-col gap-5 overflow-x-hidden overflow-y-auto pr-1"><div className="live-overview-grid grid min-w-0 flex-none gap-5 md:grid-cols-[minmax(240px,0.75fr)_minmax(0,1.25fr)]"><section className={`${card} flex min-w-0 items-center justify-center overflow-hidden p-5`}><img src={correctPosture} alt="Correct posture reference" className="h-full max-h-48 w-full object-contain" /></section><section className={`${card} min-w-0 overflow-visible p-5`}><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">Live posture</p><h1 className="mt-1 truncate text-2xl font-bold">{classification?.label || ''}</h1><p className="mt-2 truncate text-sm text-[#8eb69b]">{updated ? `Updated ${new Date(updated).toLocaleTimeString()}` : ''}</p></div><div className="flex shrink-0 flex-col items-end gap-2"><span className={`rounded-full px-3 py-2 text-xs font-bold ${statusStyle}`}>{statusLabel}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${connected ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-400/10 text-slate-300'}`}><span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-400'}`} />{connected ? 'Connected' : 'Disconnected'}</span></div></div><div className="mt-5 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">{axes.map(([key, label]) => <div key={key} className="flex min-h-[82px] min-w-0 flex-col rounded-xl border border-[#235347] bg-[#051f20] p-3"><p className="live-metric-label h-4 truncate text-xs leading-4 text-[#8eb69b]">{label}</p><p className="mt-2 flex min-h-6 items-center text-lg font-bold">{Number.isFinite(telemetry?.[key]) ? telemetry[key].toFixed(2) : <span className="text-xs font-medium text-[#8eb69b]">Waiting for data...</span>}</p></div>)}</div></section></div><section className={`${card} flex min-h-[540px] min-w-0 flex-none flex-col overflow-visible p-5`}><SectionTitle eyebrow="Rolling window" title="Sensor history" /><div className="live-charts-grid mt-4 grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-2">{axes.map(([axis, label, color]) => <AxisChart key={axis} axis={axis} label={label} color={color} history={history} />)}</div></section></div>
}

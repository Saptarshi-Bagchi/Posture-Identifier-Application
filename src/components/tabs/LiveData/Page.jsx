// ------------------------- IMPORTS -------------------------
import { useEffect, useRef, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { card, SectionTitle } from '../../posturesync/Shared'
import { getPostureImagesForClassification } from '../../posturesync/data'
import { Icon } from '../../dashboard/Icon'

// ------------------------- CHART CONFIGURATION -------------------------
const axes = [['neck_x', 'Neck X', 'rgb(var(--color-accent))'], ['neck_y', 'Neck Y', 'rgb(var(--color-muted))'], ['lumbar_x', 'Lumbar X', 'rgb(var(--color-foreground))'], ['lumbar_y', 'Lumbar Y', 'rgb(var(--color-accent))']]

// ------------------------- CHART MOTION -------------------------
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
  return <div ref={chartRef} className={`live-axis-chart ${motionClass} flex min-h-[220px] min-w-0 flex-col rounded-2xl border border-slate/25 bg-brand-panel p-4`} style={{ '--slide-duration': `${motion.duration}ms`, '--slide-offset': `${motion.offset}px` }}><p className="shrink-0 text-xs font-bold text-slate">{label}</p><div className="mt-3 min-h-0 min-w-0 flex-1">{history.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={history} margin={{ top: 12, right: 28, bottom: 24, left: 34 }}><XAxis dataKey="timestamp" type="number" domain={domain} height={24} tick={{ fontSize: 10 }} tickMargin={8} minTickGap={12} tickFormatter={(value) => new Date(value).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })} /><YAxis width={42} domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickMargin={8} /><Tooltip labelFormatter={(value) => new Date(value).toLocaleTimeString()} contentStyle={{ background: 'rgb(var(--color-surface))', border: '1px solid rgb(var(--color-divider) / .3)', borderRadius: 14, color: 'rgb(var(--color-foreground))' }} /><Line type="monotone" dataKey={axis} stroke={color} dot={false} strokeWidth={2.5} isAnimationActive={false} /></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-xs text-slate">Waiting for data...</div>}</div></div>
}

export default function LiveDataPage({ telemetry, history, classification, telemetryStatus, darkMode }) {
  const updated = telemetry?.received_at || telemetry?.timestamp
  const connected = telemetryStatus?.connected ?? telemetryStatus?.listening === true
  const postureImage = getPostureImagesForClassification(classification)[darkMode ? 'dark' : 'light']
  return <div className="tab-scroll flex h-full min-h-0 flex-col gap-6 overflow-y-auto pr-1"><section className="relative grid min-w-0 flex-none items-center gap-8 overflow-hidden rounded-3xl border border-slate/25 bg-surface p-6 shadow-sm sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:p-10"><div className="pointer-events-none absolute -left-10 -top-14 h-32 w-32 rounded-full bg-mauve/10" /><div className="relative min-w-0"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-mauve/30 bg-mauve/10 px-3 py-1.5 text-xs font-bold text-mauve"><span className="h-2 w-2 rounded-full bg-mauve" /> Posture command center</div><h1 className="max-w-xl font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-navy sm:text-6xl">Sit right.<br /><span className="text-mauve">Feel right.</span></h1><p className="mt-5 max-w-md text-sm leading-6 text-slate sm:text-base">See your alignment in real time, understand the angles behind your posture, and get a gentle nudge when you start to slouch.</p></div><div className="relative min-w-0 rounded-3xl border border-divider/30 bg-surface p-4 sm:p-6"><div className="flex items-center justify-between text-foreground"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Live posture</p><p className="mt-1 font-display text-2xl font-bold">{classification?.label || 'Good posture'}</p></div><span className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${connected ? 'bg-mauve text-offwhite' : 'bg-muted/15 text-muted'}`}><span className="h-2 w-2 rounded-full bg-current" />{connected ? 'Tracking' : 'Waiting'}</span></div><div className="mt-5 grid min-h-[210px] grid-cols-[minmax(0,1fr)_120px] items-center gap-3 rounded-2xl border border-divider/25 bg-panel p-4"><div className="flex h-full items-center justify-center rounded-2xl border border-divider/20 bg-surface"><img src={postureImage} alt={`${classification?.label || 'Good posture'} reference`} className="max-h-44 max-w-full object-contain" /></div><div className="space-y-3"><div className="rounded-2xl bg-navy p-3 text-offwhite"><p className="text-[10px] font-bold uppercase tracking-wider text-offwhite/60">Status</p><p className="mt-1 text-sm font-bold">{connected ? 'On track' : 'Ready'}</p></div><div className="rounded-2xl bg-mauve p-3 text-offwhite"><p className="text-[10px] font-bold uppercase tracking-wider text-offwhite/70">Updated</p><p className="mt-1 text-xs font-bold">{updated ? new Date(updated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}</p></div></div></div><div className="mt-3 grid grid-cols-4 gap-2">{axes.map(([key, label]) => <div key={key} className="rounded-2xl border border-divider/25 bg-panel px-2 py-2 text-foreground"><p className="text-[9px] font-bold uppercase tracking-wider text-muted">{label}</p><p className="mt-1 text-sm font-bold">{Number.isFinite(telemetry?.[key]) ? telemetry[key].toFixed(2) : '—'}</p></div>)}</div></div></section><section className={`${card} flex min-h-[540px] min-w-0 flex-none flex-col overflow-visible p-5 sm:p-7`}><SectionTitle eyebrow="Rolling window" title="Sensor history" /><div className="live-charts-grid mt-4 grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-2">{axes.map(([axis, label, color]) => <AxisChart key={axis} axis={axis} label={label} color={color} history={history} />)}</div></section></div>
}

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
  return <div ref={chartRef} className={`live-axis-chart ${motionClass} flex min-h-[220px] min-w-0 flex-col rounded-2xl border border-slate/25 bg-brand-panel p-4`} style={{ '--slide-duration': `${motion.duration}ms`, '--slide-offset': `${motion.offset}px` }}><p className="shrink-0 text-xs font-bold text-slate">{label}</p><div className="mt-3 min-h-0 min-w-0 flex-1">{history.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={history} margin={{ top: 12, right: 28, bottom: 24, left: 34 }}><XAxis dataKey="timestamp" type="number" domain={domain} height={24} tick={{ fontSize: 10 }} tickMargin={8} minTickGap={12} tickFormatter={(value) => new Date(value).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })} /><YAxis width={42} domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickMargin={8} /><Tooltip labelFormatter={(value) => new Date(value).toLocaleTimeString()} contentStyle={{ background: 'rgb(var(--color-surface))', border: '1px solid rgb(var(--color-divider) / .3)', borderRadius: 14, color: 'rgb(var(--color-foreground))' }} /><Line type="monotone" dataKey={axis} stroke={color} dot={false} strokeWidth={2.5} isAnimationActive animationDuration={500} animationEasing="ease-out" /></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-xs text-slate">Waiting for data...</div>}</div></div>
}

const workoutExercises = [
  ['Chin tucks', 'Draw your chin gently back to lengthen the neck.', 30],
  ['Shoulder rolls', 'Roll both shoulders slowly back and down.', 30],
  ['Chest opener', 'Clasp your hands behind you and breathe steadily.', 45],
  ['Seated spinal twist', 'Turn from the ribs while keeping your hips grounded.', 45],
]

function GuidedWorkout({ onBack }) {
  const [current, setCurrent] = useState(0)
  const [remaining, setRemaining] = useState(workoutExercises[0][2])
  const [running, setRunning] = useState(false)
  const exercise = workoutExercises[current]
  useEffect(() => {
    if (!running) return undefined
    const interval = window.setInterval(() => setRemaining((value) => {
      if (value > 1) return value - 1
      if (current < workoutExercises.length - 1) { setCurrent((index) => index + 1); return workoutExercises[current + 1][2] }
      setRunning(false)
      return 0
    }), 1000)
    return () => window.clearInterval(interval)
  }, [running, current])
  const select = (index) => { setCurrent(index); setRemaining(workoutExercises[index][2]); setRunning(false) }
  const next = () => select((current + 1) % workoutExercises.length)
  const progress = ((exercise[2] - remaining) / exercise[2]) * 100
  return <div className="tab-scroll mx-auto flex h-full min-h-0 max-w-4xl flex-col gap-5 overflow-y-auto pb-4"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-mauve">Guided movement</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-5xl">Workout Mode</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">Reset your alignment and release desk-day tension.</p></div><button type="button" onClick={onBack} className="min-h-11 rounded-full border border-mauve px-5 py-3 text-sm font-bold text-mauve hover:bg-mauve hover:text-offwhite">Back to tracking</button></header><div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,.9fr)]"><section className={`${card} flex min-w-0 flex-col justify-between p-5 sm:p-8`}><div><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-mauve/15 px-3 py-1.5 text-xs font-bold text-mauve">Exercise {current + 1} of {workoutExercises.length}</span><span className="text-sm font-bold text-muted">{remaining}s</span></div><h2 className="mt-10 font-display text-3xl font-bold text-navy sm:text-4xl">{exercise[0]}</h2><p className="mt-3 max-w-md text-sm leading-6 text-muted">{exercise[1]}</p><div className="mt-8 h-2 overflow-hidden rounded-full bg-muted/15"><div className="h-full rounded-full bg-mauve transition-all duration-500" style={{ width: `${progress}%` }} /></div></div><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={() => setRunning((value) => !value)} className="flex min-h-11 items-center gap-2 rounded-full bg-mauve px-6 py-3 text-sm font-bold text-offwhite hover:bg-navy"><Icon name={running ? 'pause' : 'play'} size={16} />{running ? 'Pause' : remaining === 0 ? 'Finished' : 'Start'}</button><button type="button" onClick={next} className="flex min-h-11 items-center gap-2 rounded-full border border-mauve px-5 py-3 text-sm font-bold text-mauve hover:bg-mauve hover:text-offwhite"><Icon name="next" size={16} />Next exercise</button></div></section><section className={`${card} min-w-0`}><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Session plan</p><div className="mt-4 space-y-2">{workoutExercises.map(([name, , seconds], index) => <button type="button" key={name} onClick={() => select(index)} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${index === current ? 'bg-mauve text-offwhite' : 'text-foreground hover:bg-muted/10'}`}><span className="min-w-0 truncate">{index + 1}. {name}</span><span className="shrink-0 text-xs opacity-70">{seconds}s</span></button>)}</div></section></div></div>
}

function LiveTrackingPage({ telemetry, history, classification, telemetryStatus, darkMode, onNavigate, onWorkout }) {
  const updated = telemetry?.received_at || telemetry?.timestamp
  const connected = telemetryStatus?.connected ?? telemetryStatus?.listening === true
  const postureImage = getPostureImagesForClassification(classification)[darkMode ? 'dark' : 'light']
  useEffect(() => {
    const description = [...document.querySelectorAll('p')].find((element) => element.textContent.trim() === 'See your alignment in real time, understand the angles behind your posture, and get a gentle nudge when you start to slouch.')
    if (!description || description.nextElementSibling?.dataset.calibrateEntry) return
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.calibrateEntry = 'true'
    button.className = 'mt-4 inline-flex items-center gap-2 rounded-full border border-mauve/50 bg-mauve px-6 py-3 text-base font-bold text-offwhite transition hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve'
    button.textContent = 'Analyze Posture'
    button.addEventListener('click', () => onNavigate('Calibrate'))
    description.insertAdjacentElement('afterend', button)
    const workoutButton = document.createElement('button')
    workoutButton.type = 'button'
    workoutButton.className = 'mt-4 ml-2 inline-flex items-center gap-2 rounded-full border border-mauve/50 px-6 py-3 text-base font-bold text-mauve transition hover:bg-mauve hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve'
    workoutButton.textContent = 'Workout Mode'
    workoutButton.addEventListener('click', onWorkout)
    button.insertAdjacentElement('afterend', workoutButton)
    return () => { button.remove(); workoutButton.remove() }
  }, [onNavigate, onWorkout])
  return <div className="tab-scroll live-tracking-page flex h-full min-h-0 flex-col gap-6 overflow-y-auto pr-1"><section className="live-tracking-hero relative grid h-[calc(100vh-6rem)] min-h-0 min-w-0 flex-none items-center justify-center gap-8 rounded-3xl border border-slate/25 bg-surface p-4 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:p-8"><div className="pointer-events-none absolute -left-10 -top-14 h-32 w-32 rounded-full bg-mauve/10" /><div className="live-copy relative min-w-0"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-mauve/30 bg-mauve/10 px-3 py-1.5 text-xs font-bold text-mauve"><span className="h-2 w-2 rounded-full bg-mauve" /> Live Posture</div><h1 className="max-w-xl font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-navy">Sit right.<br /><span className="text-mauve">Feel right.</span></h1><p className="mt-5 max-w-md text-sm leading-6 text-slate sm:text-base">See your alignment in real time, understand the angles behind your posture, and get a gentle nudge when you start to slouch.</p></div><div className="live-panel relative min-w-0 rounded-3xl border border-divider/30 bg-surface p-4 sm:p-6"><div className="flex items-center justify-between text-foreground"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Live posture</p><p className="mt-1 font-display text-2xl font-bold">{classification?.label || 'Good posture'}</p></div><span className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${connected ? 'bg-mauve text-offwhite' : 'bg-muted/15 text-muted'}`}><span className="h-2 w-2 rounded-full bg-current" />{connected ? 'Tracking' : 'Waiting'}</span></div><div className="live-posture-visual mt-5 grid min-h-[220px] grid-cols-[minmax(0,1fr)_140px] items-center gap-3 rounded-2xl border border-divider/25 bg-panel p-4"><div className="flex h-full items-center justify-center rounded-2xl border border-divider/20 bg-surface"><img src={postureImage} alt={`${classification?.label || 'Good posture'} reference`} className="max-h-44 max-w-full object-contain" /></div><div className="live-status-stack space-y-3"><div className="rounded-2xl bg-navy p-3 text-offwhite"><p className="text-[10px] font-bold uppercase tracking-wider text-offwhite/60">Status</p><p className="mt-1 text-sm font-bold">{connected ? 'On track' : 'Ready'}</p></div><div className="rounded-2xl bg-slate p-3 text-offwhite"><p className="text-[10px] font-bold uppercase tracking-wider text-offwhite/70">Updated</p><p className="mt-1 text-xs font-bold">{updated ? new Date(updated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}</p></div></div></div><div className="live-metrics mt-4 grid grid-cols-2 gap-3">{axes.map(([key, label]) => <div key={key} className="rounded-2xl border border-divider/25 bg-panel px-4 py-4 text-foreground transition-colors duration-300"><p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p><p className="mt-2 text-lg font-bold transition-all duration-300 ease-out">{Number.isFinite(telemetry?.[key]) ? telemetry[key].toFixed(2) : '—'}</p></div>)}</div></div></section><section className={`${card} flex min-h-[540px] min-w-0 flex-none flex-col overflow-visible p-5 sm:p-7`}><SectionTitle eyebrow="Rolling window" title="Sensor history" /><div className="live-charts-grid mt-4 grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-2">{axes.map(([axis, label, color]) => <AxisChart key={axis} axis={axis} color={color} label={label} history={history} />)}</div></section></div>
}

export default function LiveDataPage(props) {
  const [workoutMode, setWorkoutMode] = useState(false)
  return workoutMode ? <GuidedWorkout onBack={() => setWorkoutMode(false)} /> : <LiveTrackingPage {...props} onWorkout={() => setWorkoutMode(true)} />
}

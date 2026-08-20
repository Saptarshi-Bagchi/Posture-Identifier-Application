import { useEffect, useMemo, useState } from 'react'

// Mock data contract for the UI. Replace these values with live ESP32 data later.
// TODO: replace with live ESP32 data via preload.js bridge.
export const mockPostureData = {
  states: {
    good: {
      label: 'Good Posture',
      shortLabel: 'Great alignment',
      description: 'Your shoulders are relaxed and your spine is aligned.',
      tone: 'emerald',
      icon: 'check',
    },
    slight: {
      label: 'Slight Slouch',
      shortLabel: 'Small adjustment',
      description: 'You are starting to lean forward. Reset your position when ready.',
      tone: 'amber',
      icon: 'adjust',
    },
    slouching: {
      label: 'Slouching – Action Required',
      shortLabel: 'Needs attention',
      description: 'Your posture has been out of alignment for a little while.',
      tone: 'rose',
      icon: 'alert',
    },
  },
  session: {
    goodMinutes: 42,
    trackedMinutes: 60,
    warnings: 3,
    longestStreak: '18 min',
  },
  events: [
    { time: '2:15 PM', title: 'Slouch detected', detail: 'Forward lean noticed', tone: 'rose' },
    { time: '2:16 PM', title: 'Posture corrected', detail: 'Back in alignment', tone: 'emerald' },
    { time: '2:31 PM', title: 'Slight slouch', detail: 'Small adjustment needed', tone: 'amber' },
    { time: '2:32 PM', title: 'Posture corrected', detail: 'Shoulders relaxed', tone: 'emerald' },
    { time: '2:48 PM', title: 'Good posture streak', detail: '18 minutes and counting', tone: 'sky' },
  ],
}

const toneStyles = {
  emerald: {
    card: 'border-emerald-400/20 bg-emerald-400/[0.06]',
    icon: 'bg-emerald-400/15 text-emerald-300',
    text: 'text-emerald-300',
    bar: 'bg-emerald-400',
  },
  amber: {
    card: 'border-amber-300/20 bg-amber-300/[0.06]',
    icon: 'bg-amber-300/15 text-amber-200',
    text: 'text-amber-200',
    bar: 'bg-amber-300',
  },
  rose: {
    card: 'border-rose-400/25 bg-rose-400/[0.07]',
    icon: 'bg-rose-400/15 text-rose-300',
    text: 'text-rose-300',
    bar: 'bg-rose-400',
  },
  sky: {
    card: 'border-sky-400/20 bg-sky-400/[0.06]',
    icon: 'bg-sky-400/15 text-sky-300',
    text: 'text-sky-300',
    bar: 'bg-sky-400',
  },
}

function Icon({ name, size = 20, strokeWidth = 1.8 }) {
  const paths = {
    check: <><path d="m5 12 4 4L19 6" /><circle cx="12" cy="12" r="9" /></>,
    adjust: <><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="3" /></>,
    alert: <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    moon: <path d="M20.5 15.2A8.6 8.6 0 0 1 8.8 3.5 8.6 8.6 0 1 0 20.5 15.2Z" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="M12 3 19 6v5c0 4.4-3 8-7 10-4-2-7-5.6-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    volume: <><path d="M4 10v4h3l4 3V7l-4 3H4Zm11-2a5 5 0 0 1 0 8m2-11a9 9 0 0 1 0 14" /></>,
    spark: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /><path d="m19 17 .5 2.5L22 20l-2.5.5L19 23l-.5-2.5L16 20l2.5-.5L19 17Z" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function Toggle({ enabled, onChange }) {
  return <button type="button" aria-pressed={enabled} onClick={() => onChange(!enabled)} className={`relative h-6 w-11 rounded-full transition ${enabled ? 'bg-sky-400' : 'bg-white/10'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${enabled ? 'left-6' : 'left-1'}`} /></button>
}

function TrayPopup() {
  const [postureState, setPostureState] = useState('good')
  const [monitoring, setMonitoring] = useState(true)
  const current = mockPostureData.states[postureState]
  const tone = toneStyles[current.tone]
  const electronAPI = window.electronAPI

  useEffect(() => {
    let unsubscribe
    electronAPI?.getMonitoringState().then(setMonitoring)
    unsubscribe = electronAPI?.onMonitoringStateChanged(setMonitoring)
    return () => unsubscribe?.()
  }, [electronAPI])

  const toggleMonitoring = async () => {
    if (electronAPI) setMonitoring(await electronAPI.toggleMonitoring())
    else setMonitoring((value) => !value)
  }

  return <div className="min-h-screen bg-[#0b111b] p-4 text-white"><div className="rounded-[1.35rem] border border-white/10 bg-gradient-to-br from-white/[0.1] to-white/[0.035] p-5 shadow-2xl shadow-black/30"><div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-400 text-[#08111d]"><Icon name="shield" size={17} /></div><span className="text-sm font-bold">PostureGuard</span></div><span className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${monitoring ? 'text-emerald-300' : 'text-slate-500'}`}><span className={`h-1.5 w-1.5 rounded-full ${monitoring ? 'bg-emerald-400' : 'bg-slate-500'}`} />{monitoring ? 'Monitoring' : 'Paused'}</span></div><div className={`mb-4 flex flex-col items-center rounded-2xl border p-5 text-center transition-all duration-300 ${tone.card}`}><div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${tone.icon} ${postureState === 'slouching' ? 'animate-pulse' : ''}`}><Icon name={current.icon} size={28} /></div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Current posture</p><p className={`mt-1 text-lg font-bold ${tone.text}`}>{current.label}</p></div><div className="mb-5 flex items-center justify-between rounded-xl bg-white/[0.05] px-3 py-2.5"><div><p className="text-xs font-medium">Good posture time</p><p className="mt-0.5 text-[11px] text-slate-500">This session</p></div><p className="text-lg font-bold text-emerald-300">{mockPostureData.session.goodMinutes}m</p></div><button type="button" onClick={toggleMonitoring} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs font-semibold transition hover:bg-white/[0.12] active:scale-[0.98]">{monitoring ? 'Pause monitoring' : 'Resume monitoring'}</button><button type="button" onClick={() => electronAPI?.openDashboard()} className="mt-4 w-full text-center text-xs font-medium text-sky-300 transition hover:text-sky-200">Open full dashboard <span aria-hidden="true">→</span></button></div></div>
}

function App() {
  if (new URLSearchParams(window.location.search).get('view') === 'tray') return <TrayPopup />

  const [postureState, setPostureState] = useState('good')
  const [isDark, setIsDark] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(true)
  const [sensitivity, setSensitivity] = useState(72)
  const [warningDelay, setWarningDelay] = useState(8)
  const [soundAlerts, setSoundAlerts] = useState(true)
  const [autoLidClose, setAutoLidClose] = useState(false)
  const [launchOnStartup, setLaunchOnStartup] = useState(false)
  const [countdown, setCountdown] = useState(8)
  const [warningDismissed, setWarningDismissed] = useState(false)
  const [clock, setClock] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    window.electronAPI?.getLaunchOnStartup().then(setLaunchOnStartup)
  }, [])

  useEffect(() => {
    setCountdown(warningDelay)
    setWarningDismissed(false)
  }, [postureState, warningDelay])

  useEffect(() => {
    if (postureState !== 'slouching' || warningDismissed || countdown <= 0) return undefined
    const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [postureState, warningDismissed, countdown])

  const current = mockPostureData.states[postureState]
  const tone = toneStyles[current.tone]
  const formattedClock = clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const formattedDate = clock.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
  const postureOptions = Object.entries(mockPostureData.states)
  const progress = useMemo(() => Math.round((mockPostureData.session.goodMinutes / mockPostureData.session.trackedMinutes) * 100), [])

  const handleLaunchOnStartup = async (enabled) => {
    setLaunchOnStartup(enabled)
    const confirmed = await window.electronAPI?.setLaunchOnStartup(enabled)
    if (typeof confirmed === 'boolean') setLaunchOnStartup(confirmed)
  }

  return <div className={`${isDark ? 'dark' : ''} min-h-screen bg-[#f4f7fb] text-slate-900 transition-colors duration-500 dark:bg-[#0b111b] dark:text-white`}>
    <div className="mx-auto min-h-screen max-w-[1440px] px-5 py-5 sm:px-8 lg:px-10">
      <header className="mb-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400 text-[#08111d] shadow-lg shadow-sky-400/20"><Icon name="shield" size={22} /></div>
          <div><p className="text-lg font-bold tracking-tight">PostureGuard</p><p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">Desk wellness monitor</p></div>
        </div>
        <div className="flex items-center gap-5">
          <div className="hidden text-right sm:block"><p className="text-sm font-semibold tabular-nums">{formattedClock}</p><p className="text-xs text-slate-500">{formattedDate}</p></div>
          <button type="button" onClick={() => setIsDark(!isDark)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300" aria-label="Toggle light mode">{isDark ? <Icon name="sun" size={18} /> : <Icon name="moon" size={18} />}</button>
        </div>
      </header>

      <main className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_318px]">
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">Live session</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">How are you sitting?</h1></div><label className="flex items-center gap-2 text-xs text-slate-500">Preview state<select value={postureState} onChange={(event) => setPostureState(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200">{postureOptions.map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label></div>

          <article className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br from-white/[0.08] to-transparent p-6 shadow-2xl shadow-slate-200/50 transition-all duration-300 dark:shadow-black/20 sm:p-8 ${tone.card} ${postureState === 'slouching' ? 'shadow-rose-950/30' : ''}`}>
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-current opacity-[0.035] blur-3xl" />
            <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
              <div><div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${tone.icon} ${postureState === 'slouching' ? 'animate-pulse' : ''}`}><Icon name={current.icon} size={29} strokeWidth={1.7} /></div><p className={`mb-2 text-xs font-bold uppercase tracking-[0.18em] ${tone.text}`}>Current status</p><h2 className="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">{current.label}</h2><p className="mt-3 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">{current.description}</p></div>
              <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end"><div className="flex items-center gap-2 text-xs text-slate-500"><span className={`h-2 w-2 animate-pulse rounded-full ${tone.bar}`} /> Sensor preview active</div><div className="rounded-2xl border border-slate-200/80 bg-white/60 px-4 py-3 text-right dark:border-white/10 dark:bg-black/10"><p className="text-[10px] uppercase tracking-widest text-slate-500">Confidence</p><p className="mt-1 text-2xl font-bold">94<span className="text-sm text-slate-500">%</span></p></div></div>
            </div>
          </article>

          {postureState === 'slouching' && !warningDismissed && <div className="animate-[slideDown_300ms_ease-out] rounded-2xl border border-rose-400/30 bg-gradient-to-r from-rose-500/[0.14] to-rose-400/[0.04] p-4 shadow-xl shadow-rose-950/10"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-400/15 text-rose-300"><Icon name="alert" size={21} /></div><div><p className="text-sm font-semibold text-rose-200">Please sit up straight!</p><p className="mt-1 text-xs text-rose-200/70">Mock lid-close countdown: action would begin in <span className="font-bold tabular-nums text-rose-100">{countdown}s</span>.</p></div></div><button type="button" onClick={() => { setWarningDismissed(true); setPostureState('good') }} className="rounded-xl bg-rose-300 px-4 py-2.5 text-xs font-bold text-rose-950 transition hover:bg-rose-200 active:scale-[0.98]">I've corrected my posture</button></div></div>}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Posture timeline</h2><p className="mt-1 text-xs text-slate-500">Activity from the last hour</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-white/[0.06]">Today</span></div><div className="space-y-0">{mockPostureData.events.map((event, index) => { const eventTone = toneStyles[event.tone]; return <div key={`${event.time}-${event.title}`} className="relative flex gap-4 pb-5 last:pb-0"><div className="relative flex w-12 shrink-0 justify-center"><span className={`relative z-10 mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-[#101722] ${eventTone.bar}`} />{index < mockPostureData.events.length - 1 && <span className="absolute top-4 h-full w-px bg-slate-200 dark:bg-white/10" />}</div><div className="flex flex-1 items-start justify-between gap-3"><div><p className="text-sm font-medium">{event.title}</p><p className="mt-1 text-xs text-slate-500">{event.detail}</p></div><time className="whitespace-nowrap text-xs tabular-nums text-slate-500">{event.time}</time></div></div> })}</div></div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Session stats</h2><p className="mt-1 text-xs text-slate-500">Since 1:48 PM</p></div><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-400"><Icon name="spark" size={18} /></div></div><div className="mb-6 flex items-end justify-between"><div><p className="text-3xl font-bold">{progress}%</p><p className="mt-1 text-xs text-slate-500">good posture time</p></div><div className="text-right"><p className="text-sm font-semibold">{mockPostureData.session.goodMinutes}m <span className="font-normal text-slate-500">/ {mockPostureData.session.trackedMinutes}m</span></p></div></div><div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${progress}%` }} /></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.04]"><p className="text-xl font-bold">{mockPostureData.session.warnings}</p><p className="mt-1 text-[11px] text-slate-500">slouch warnings</p></div><div className="rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.04]"><p className="text-xl font-bold">{mockPostureData.session.longestStreak}</p><p className="mt-1 text-[11px] text-slate-500">longest streak</p></div></div></section>

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.035]"><button type="button" onClick={() => setSettingsOpen(!settingsOpen)} className="flex w-full items-center justify-between p-5 text-left"><div><h2 className="font-semibold">Monitor settings</h2><p className="mt-1 text-xs text-slate-500">Tune your desk experience</p></div><span className={`text-slate-500 transition-transform ${settingsOpen ? 'rotate-180' : ''}`}><Icon name="chevron" size={18} /></span></button>{settingsOpen && <div className="space-y-5 border-t border-slate-200 px-5 pb-5 pt-4 dark:border-white/10"><label className="block"><div className="mb-2 flex justify-between text-xs"><span className="font-medium">Sensitivity</span><span className="text-sky-400">{sensitivity}%</span></div><input type="range" min="0" max="100" value={sensitivity} onChange={(event) => setSensitivity(event.target.value)} className="h-1.5 w-full cursor-pointer accent-sky-400" /></label><label className="block"><div className="mb-2 flex justify-between text-xs"><span className="font-medium">Warning delay</span><span className="text-sky-400">{warningDelay}s</span></div><input type="range" min="3" max="30" value={warningDelay} onChange={(event) => setWarningDelay(Number(event.target.value))} className="h-1.5 w-full cursor-pointer accent-sky-400" /></label><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-slate-500"><Icon name="volume" size={18} /></span><div><p className="text-xs font-medium">Sound alerts</p><p className="mt-0.5 text-[11px] text-slate-500">Play a gentle reminder</p></div></div><Toggle enabled={soundAlerts} onChange={setSoundAlerts} /></div><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-slate-500"><Icon name="shield" size={18} /></span><div><p className="text-xs font-medium">Auto lid-close</p><p className="mt-0.5 text-[11px] text-slate-500">Mock preview only</p></div></div><Toggle enabled={autoLidClose} onChange={setAutoLidClose} /></div></div>}</section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.035]"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">Launch on startup</h2><p className="mt-1 text-[11px] text-slate-500">Start minimized in the system tray</p></div><Toggle enabled={launchOnStartup} onChange={handleLaunchOnStartup} /></div></section>
        </aside>
      </main>
      <footer className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-[11px] text-slate-500 dark:border-white/10"><span>PostureGuard UI preview</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Local mock data</span></footer>
    </div>
  </div>
}

export default App

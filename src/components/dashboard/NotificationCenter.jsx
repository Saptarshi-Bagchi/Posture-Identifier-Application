// ------------------------- IMPORTS -------------------------
import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

// ------------------------- NOTIFICATION STYLES -------------------------
const typeStyles = {
  'bad-posture': { icon: 'alert', color: 'text-red-300', label: 'Posture' },
  'break-reminder': { icon: 'bell', color: 'text-sky-300', label: 'Break' },
  'resend-reminder': { icon: 'history', color: 'text-amber-300', label: 'Reminder' },
}

// ------------------------- COUNTDOWN FORMATTING -------------------------
function formatCountdown(seconds) {
  if (seconds === null || seconds === undefined) return '--:--'
  const safeSeconds = Math.max(0, seconds)
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`
}

// ------------------------- NOTIFICATION CENTER -------------------------
export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [entries, setEntries] = useState([])
  const [timerState, setTimerState] = useState({ phase: 'waiting-for-break', timeUntilNextBreakPrompt: null })
  const openRef = useRef(false)

  useEffect(() => {
    openRef.current = open
    if (open) setUnread(0)
  }, [open])

  useEffect(() => {
    const api = window.electronAPI
    api?.getNotificationLog?.().then((snapshot) => setEntries(snapshot || []))
    api?.getBreakTimerState?.().then(setTimerState)
    const removeInit = api?.onNotificationLogInit?.((snapshot) => setEntries(snapshot || []))
    const removeUpdate = api?.onNotificationLogUpdate?.((entry) => {
      setEntries((current) => [...current, entry].slice(-50))
      if (!openRef.current) setUnread((count) => count + 1)
    })
    const removeTimer = api?.onBreakTimerState?.(setTimerState)
    return () => { removeInit?.(); removeUpdate?.(); removeTimer?.() }
  }, [])

  const toggle = () => setOpen((current) => !current)
  const countdown = timerState.phase === 'waiting-for-movement'
    ? ['Checking for movement in:', timerState.timeUntilNextResendCheck]
    : timerState.phase === 'walk-in-progress'
      ? ['Back to work in:', timerState.timeUntilBackToWork]
      : ['Next break reminder in:', timerState.timeUntilNextBreakPrompt]

  return <div className="relative"><button type="button" onClick={toggle} aria-expanded={open} aria-label="Notification history" className="relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#8eb69b] hover:bg-[#163832] hover:text-[#daf1de]"><span className="relative"><Icon name="bell" size={19} />{unread > 0 && <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] leading-4 text-white">{unread > 9 ? '9+' : unread}</span>}</span><span>Notifications</span></button>{open && <section className="absolute bottom-full left-0 z-50 mb-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-2xl" role="dialog" aria-label="Notification history"><div className="mb-4 rounded-xl bg-brand-panel p-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-secondary">{countdown[0]}</p><p className="mt-1 text-2xl font-bold tabular-nums">{formatCountdown(countdown[1])}</p></div><div className="max-h-64 space-y-3 overflow-y-auto pr-1">{entries.length === 0 ? <p className="py-6 text-center text-sm text-brand-secondary">No notifications yet</p> : [...entries].reverse().map((entry, index) => { const style = typeStyles[entry.type] || typeStyles['break-reminder']; return <article key={`${entry.timestamp}-${index}`} className="flex gap-3 border-b border-brand-border pb-3 last:border-0"><span className={`mt-0.5 ${style.color}`}><Icon name={style.icon} size={17} /></span><div className="min-w-0"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold">{entry.title}</p><time className="shrink-0 text-[10px] text-brand-secondary">{new Date(entry.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div><p className="mt-1 text-xs leading-4 text-brand-secondary">{entry.body}</p></div></article> })}</div></section>}</div>
}

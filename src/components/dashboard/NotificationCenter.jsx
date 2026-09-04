// ------------------------- IMPORTS -------------------------
import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

// ------------------------- NOTIFICATION STYLES -------------------------
const typeStyles = {
  'bad-posture': { icon: 'alert', color: 'text-red-300', label: 'Posture' },
  'break-reminder': { icon: 'bell', color: 'text-sky-300', label: 'Break' },
  'sit-stand': { icon: 'bell', color: 'text-mauve', label: 'Stand' },
  'stand-walk': { icon: 'live', color: 'text-mauve', label: 'Walk' },
  'walk-sit': { icon: 'check', color: 'text-mauve', label: 'Sit' },
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
  const [timerState, setTimerState] = useState({ phase: 'disconnected', secondsRemaining: null })
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
  const phaseNames = { sitting: 'Sitting', standing: 'Standing', walking: 'Walking' }
  const countdown = ['sitting', 'standing', 'walking'].includes(timerState.phase)
    ? [`Time remaining in ${phaseNames[timerState.phase].toLowerCase()}:`, timerState.secondsRemaining]
    : null
  const typeStyle = (entry) => typeStyles[entry.type] || { icon: 'bell', color: 'text-mauve' }

  return (
    <div className="relative">
      <button type="button" onClick={toggle} aria-expanded={open} aria-label="Notifications" title="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full text-offwhite/75 transition hover:bg-offwhite/10 hover:text-offwhite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve">
        <Icon name="bell" size={17} strokeWidth={2.4} />
        {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-mauve ring-2 ring-navy" />}
      </button>
      {open && <section className="absolute right-0 top-full z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-2xl" role="dialog" aria-label="Notification history">
        {countdown && <div className="mb-4 rounded-xl bg-brand-panel p-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-secondary">{countdown[0]}</p><p className="mt-1 text-2xl font-bold tabular-nums">{formatCountdown(countdown[1])}</p></div>}
        {entries.length === 0 ? <p className="py-6 text-center text-sm text-brand-secondary">No notifications yet</p> : <div className="max-h-72 space-y-3 overflow-y-auto">{[...entries].reverse().map((entry, index) => { const style = typeStyle(entry); return <article key={`${entry.timestamp}-${index}`} className="flex gap-3 border-b border-brand-border pb-3 last:border-0"><span className={style.color}><Icon name={style.icon} size={17} /></span><div className="min-w-0"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold">{entry.title}</p><time className="shrink-0 text-[10px] text-brand-secondary">{new Date(entry.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div><p className="mt-1 text-xs leading-4 text-brand-secondary">{entry.body}</p></div></article> })}</div>}
      </section>}
    </div>
  )
}

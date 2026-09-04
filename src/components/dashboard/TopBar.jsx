// ------------------------- IMPORTS -------------------------
import { Icon } from './Icon'

// ------------------------- TOP BAR COMPONENT -------------------------
export default function TopBar({ title, showTitle = true, darkMode, onThemeChange }) {
  return <header className="flex items-center justify-between gap-4 rounded-2xl border border-slate/25 bg-white px-5 py-4 shadow-sm"><div><p className="text-xs font-bold uppercase tracking-wider text-mauve">I-SPA</p>{showTitle && <h1 className="mt-1 font-display text-2xl font-bold text-navy">{title}</h1>}</div><button type="button" onClick={() => onThemeChange(!darkMode)} aria-pressed={darkMode} aria-label="Toggle light and dark theme" className="relative flex h-8 w-14 shrink-0 items-center rounded-full bg-slate/20 p-1 transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve"><span className={`flex h-6 w-6 items-center justify-center rounded-full bg-mauve text-offwhite shadow-sm transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}><Icon name={darkMode ? 'moon' : 'sun'} size={13} strokeWidth={2.5} /></span></button></header>
}

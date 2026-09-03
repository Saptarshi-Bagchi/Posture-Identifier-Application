// ------------------------- IMPORTS -------------------------
import { Icon } from './Icon'

// ------------------------- TOP BAR COMPONENT -------------------------
export default function TopBar({ title, showTitle = true, darkMode, onThemeChange }) {
  return <header className="flex items-center justify-between gap-4 rounded-2xl border border-[#235347] bg-brand-surface px-5 py-4 shadow-sm transition-colors duration-300 ease-in-out"><div><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">ISPA</p>{showTitle && <h1 className="mt-1 text-2xl font-bold">{title}</h1>}</div><button type="button" onClick={() => onThemeChange(!darkMode)} className="flex shrink-0 items-center gap-2 rounded-xl border border-[#8eb69b] px-3 py-2 text-sm font-semibold transition-colors duration-300 ease-in-out"><Icon name={darkMode ? 'moon' : 'sun'} size={17} /><span>{darkMode ? 'Dark' : 'Light'}</span></button></header>
}

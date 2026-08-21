import { Icon } from './Icon'
import { Toggle } from '../posturesync/Shared'

export default function TopBar({ title, darkMode, onThemeChange, device }) {
  const date = new Date()
  return <header className="flex flex-col justify-between gap-4 border-b border-[#235347] pb-5 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">PostureGuard · Precision Health</p><h1 className="mt-1 text-2xl font-bold">{title}</h1></div><div className="flex items-center gap-4"><div className="hidden text-right sm:block"><p className="text-xs font-bold">{date.toLocaleDateString(undefined, { weekday: 'long' })}</p><p className="text-[11px] text-[#8eb69b]">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p></div><span className="flex items-center gap-2 text-xs text-emerald-300"><Icon name="live" size={18} />{device.signal}%</span><span className="relative text-[#8eb69b]"><Icon name="bell" size={19} /><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-400" /></span><Toggle enabled={darkMode} onChange={onThemeChange} /></div></header>
}

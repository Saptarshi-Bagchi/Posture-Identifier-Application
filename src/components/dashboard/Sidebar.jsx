// ------------------------- IMPORTS -------------------------
import logoSrc from '../../assets/ispa-logo.png'
import { Icon } from './Icon'
import NotificationCenter from './NotificationCenter'

// ------------------------- NAVIGATION CONFIGURATION -------------------------
const navigation = [['Live Posture', 'live'], ['Posture Almanac', 'book'], ['Device Connection', 'wifi'], ['Settings', 'settings']]

// ------------------------- SIDEBAR COMPONENT -------------------------
export default function Sidebar({ activeTab, onNavigate, serialStatus }) {
  const state = serialStatus?.state || (serialStatus?.error ? 'error' : serialStatus?.listening ? 'connected' : 'disconnected')
  const stateLabel = { connected: 'Connected', connecting: 'Connecting', error: 'Error', disconnected: 'Disconnected' }[state] || 'Disconnected'
  const stateColor = { connected: 'bg-emerald-400', connecting: 'bg-amber-300', error: 'bg-red-400', disconnected: 'bg-slate-400' }[state] || 'bg-slate-400'
  return <aside className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[#235347] bg-[#0b2b26] px-2 py-2 text-[#daf1de] transition-colors duration-300 ease-in-out lg:relative lg:inset-auto lg:h-full lg:w-72 lg:flex-none lg:flex-col lg:border-r lg:border-t-0 lg:px-6 lg:py-8"><div className="hidden items-center gap-3 px-2 lg:flex"><img src={logoSrc} alt="ISPA" className="logo-mark h-14 w-14 rounded-xl border bg-white object-contain" /><div><p className="text-xl font-bold">ISPA</p><p className="text-xs text-[#8eb69b]">Spine alignment</p></div></div><nav className="flex w-full items-center justify-around gap-2 lg:mt-12 lg:block lg:space-y-3">{navigation.map(([label, icon]) => <button key={label} type="button" onClick={() => onNavigate(label)} className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-semibold transition lg:w-full lg:flex-row lg:gap-4 lg:px-4 lg:py-4 lg:text-left lg:text-base ${activeTab === label ? 'bg-[#8eb69b] text-[#051f20]' : 'text-[#8eb69b] hover:bg-[#163832] hover:text-[#daf1de]'}`}><Icon name={icon} size={21} /><span className="whitespace-nowrap">{label}</span></button>)}</nav><div className="mt-auto hidden lg:block"><NotificationCenter /><div className="mt-3 border-t border-[#235347] px-2 pt-5"><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8eb69b]">Serial status</p><div className="flex items-center gap-2 text-sm font-semibold"><span className={`h-2.5 w-2.5 rounded-full ${stateColor}`} /><span>{stateLabel}</span></div></div></div></aside>
}

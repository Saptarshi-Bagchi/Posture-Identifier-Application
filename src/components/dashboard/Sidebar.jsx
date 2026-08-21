import logoSrc from '../../assets/postureguard-logo.png'
import { Icon } from './Icon'

const navigation = [
  ['Dashboard', 'dashboard'],
  ['Live Monitoring', 'live'],
  ['Laptop Control', 'monitor'],
  ['Analytics', 'chart'],
  ['Posture Almanac', 'book'],
  ['Alerts', 'alert'],
  ['Device & Settings', 'settings'],
]

export default function Sidebar({ device, activeTab, onNavigate }) {
  return <aside className="flex w-full shrink-0 flex-col border-b border-[#235347] bg-[#0b2b26] px-5 py-5 text-[#daf1de] lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:border-b-0 lg:border-r lg:px-4"><div className="flex items-center gap-3 px-2"><img src={logoSrc} alt="PostureGuard" className="h-11 w-11 rounded-xl object-cover" /><div><p className="text-[15px] font-bold leading-tight">Posture<span className="text-[#8eb69b]">Guard</span></p><p className="mt-1 text-[10px] text-[#8eb69b]">Precision Health</p></div></div><nav className="mt-7 grid grid-cols-4 gap-1 sm:grid-cols-7 lg:block lg:space-y-1">{navigation.map(([label, icon]) => <button key={label} type="button" onClick={() => onNavigate(label)} className={`flex w-full items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition lg:justify-start ${activeTab === label ? 'bg-[#8eb69b] text-[#051f20]' : 'text-[#8eb69b] hover:bg-[#163832] hover:text-[#daf1de]'}`}><Icon name={icon} size={17} /> <span className="hidden sm:inline">{label}</span></button>)}</nav><div className="mt-7 border-t border-[#235347] pt-5 lg:mt-auto"><div className="mb-5 rounded-xl border border-[#235347] bg-[#051f20] p-3"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${device.connected ? 'bg-emerald-400' : 'bg-slate-400'}`} /><p className="text-xs font-bold">{device.connected ? 'ESP32 Connected' : 'ESP32 Disconnected'}</p></div><p className="mt-2 text-[11px] text-[#8eb69b]">Port: COM3 · Signal {device.signal}%</p><button type="button" className="mt-3 w-full rounded-lg border border-[#235347] px-3 py-2 text-[11px] font-semibold text-[#8eb69b] hover:bg-[#163832]">Disconnect</button></div><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8eb69b] text-xs font-bold text-[#051f20]">AM</span><div><p className="text-xs font-bold">Alex Morgan</p><p className="mt-1 text-[10px] text-[#8eb69b]">Personal account</p></div></div><div className="mt-4 flex gap-4 text-[11px] text-[#8eb69b]"><button type="button">Support</button><button type="button">Log Out</button></div></div></aside>
}

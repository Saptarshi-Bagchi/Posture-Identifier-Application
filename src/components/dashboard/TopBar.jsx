import { Toggle } from '../posturesync/Shared'

export default function TopBar({ title, darkMode, onThemeChange }) {
  return <header className="flex items-center justify-between gap-4 border-b border-[#235347] pb-5"><div><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">ISPA</p><h1 className="mt-1 text-2xl font-bold">{title}</h1></div><Toggle enabled={darkMode} onChange={onThemeChange} /></header>
}

// ------------------------- IMPORTS -------------------------
import { useEffect, useState } from 'react'
import { card, SectionTitle } from '../../posturesync/Shared'

// ------------------------- SETTINGS PAGE -------------------------
export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [alertMode, setAlertMode] = useState('hardware')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.electronAPI?.getAppSettings?.().then((settings) => {
      setDisplayName(settings?.displayName || '')
      setAlertMode(settings?.alertMode === 'software' ? 'software' : 'hardware')
    })
  }, [])

  const saveSettings = async (nextSettings = { displayName, alertMode }) => {
    const settings = await window.electronAPI?.saveAppSettings?.(nextSettings)
    if (settings) {
      setDisplayName(settings.displayName)
      setAlertMode(settings.alertMode)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1800)
    }
  }

  const toggleAlertMode = async () => {
    const nextMode = alertMode === 'hardware' ? 'software' : 'hardware'
    setAlertMode(nextMode)
    await saveSettings({ displayName, alertMode: nextMode })
  }

  return <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-6"><div className="flex-none"><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">Application</p><h1 className="mt-1 text-2xl font-bold">Settings</h1><p className="mt-2 text-sm text-[#8eb69b]">Configure your profile and posture alert behavior.</p></div><div className="grid min-h-0 flex-1 gap-6 overflow-y-auto pb-2"><section className={`${card} flex-none`}><SectionTitle eyebrow="Profile" title="Display name" /><label className="block text-sm font-semibold text-slate-400">Name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Enter your display name" className="mt-2 w-full rounded-xl border border-brand-border bg-brand-navy px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-brand-cyan" /></label><div className="mt-4 flex items-center gap-3"><button type="button" onClick={saveSettings} className="rounded-xl bg-[#8eb69b] px-5 py-2.5 text-sm font-bold text-[#051f20]">Save</button>{saved && <span className="text-sm text-emerald-300">Saved</span>}</div></section><section className={`${card} flex-none`}><SectionTitle eyebrow="App Configuration" title="Posture alert mode" /><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">{alertMode === 'hardware' ? 'Hardware Mode' : 'Software Mode'}</p><p className="mt-1 text-sm text-slate-400">{alertMode === 'hardware' ? 'Use native OS notifications and notification history.' : 'Use the fullscreen posture overlay only.'}</p></div><button type="button" role="switch" aria-checked={alertMode === 'software'} onClick={toggleAlertMode} className={`relative h-7 w-12 shrink-0 rounded-full transition ${alertMode === 'software' ? 'bg-brand-cyan' : 'bg-brand-border'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${alertMode === 'software' ? 'left-6' : 'left-1'}`} /></button></div><div className="mt-4 flex gap-2 text-xs font-semibold"><span className={`rounded-full px-3 py-1.5 ${alertMode === 'hardware' ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-brand-panel text-slate-400'}`}>Hardware Mode</span><span className={`rounded-full px-3 py-1.5 ${alertMode === 'software' ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-brand-panel text-slate-400'}`}>Software Mode</span></div></section></div></div>
}

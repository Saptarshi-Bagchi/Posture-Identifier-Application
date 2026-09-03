// ------------------------- IMPORTS -------------------------
import { useEffect, useState } from 'react'
import { card, SectionTitle } from '../../posturesync/Shared'

// ------------------------- SETTINGS PAGE -------------------------
export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [alertMode, setAlertMode] = useState('hardware')
  const [nameSaved, setNameSaved] = useState(false)

  useEffect(() => {
    window.electronAPI?.getAppSettings?.().then((settings) => {
      setDisplayName(settings?.displayName || '')
      setAlertMode(settings?.alertMode === 'software' ? 'software' : 'hardware')
    })
  }, [])

  const saveSettings = async (nextSettings = { displayName, alertMode }, showNameSaved = false) => {
    const settings = await window.electronAPI?.saveAppSettings?.(nextSettings)
    if (settings) {
      setDisplayName(settings.displayName)
      setAlertMode(settings.alertMode)
      if (showNameSaved) {
        setNameSaved(true)
        window.setTimeout(() => setNameSaved(false), 1800)
      }
    }
  }

  const saveDisplayName = async () => {
    await saveSettings({ displayName, alertMode }, true)
  }

  const toggleAlertMode = async () => {
    const nextMode = alertMode === 'hardware' ? 'software' : 'hardware'
    setAlertMode(nextMode)
    await saveSettings({ displayName, alertMode: nextMode })
  }

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-6">
      <div className="flex-none">
        <p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">Application</p>
        <h1 className="mt-1 text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-[#8eb69b]">Configure your profile and posture alert behavior.</p>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto pb-2">
        <section className={`${card} flex-none`}>
          <SectionTitle eyebrow="Profile" title="Display name" />
          <label className="block text-sm font-semibold text-slate-400">
            Name
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Enter your display name" className="mt-2 w-full rounded-xl border border-brand-border bg-brand-navy px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-brand-cyan" />
          </label>
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={saveDisplayName} className="rounded-xl bg-[#8eb69b] px-5 py-2.5 text-sm font-bold text-[#051f20]">Save</button>
            {nameSaved && <span className="text-sm text-emerald-300">Saved</span>}
          </div>
        </section>

        <section className={`${card} flex-none`}>
          <SectionTitle eyebrow="App Configuration" title="Posture alert mode" />
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold">{alertMode === 'hardware' ? 'Hardware Mode' : 'Software Mode'}</p>
              <p className="mt-1 text-sm text-slate-400">{alertMode === 'hardware' ? 'Use native OS notifications and notification history.' : 'Use the fullscreen posture overlay only.'}</p>
            </div>

            <div role="group" aria-label="Posture alert mode" className="relative inline-flex w-fit shrink-0 rounded-full border border-brand-border bg-brand-navy p-1">
              <span aria-hidden="true" className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-brand-cyan transition-transform duration-200 ease-out ${alertMode === 'software' ? 'translate-x-full' : 'translate-x-0'}`} />
              <button type="button" aria-pressed={alertMode === 'hardware'} onClick={() => alertMode !== 'hardware' && toggleAlertMode()} className={`relative z-10 min-w-24 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${alertMode === 'hardware' ? 'text-brand-navy' : 'text-slate-400 hover:bg-brand-panel hover:text-slate-100'}`}>Hardware</button>
              <button type="button" aria-pressed={alertMode === 'software'} onClick={() => alertMode !== 'software' && toggleAlertMode()} className={`relative z-10 min-w-24 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${alertMode === 'software' ? 'text-brand-navy' : 'text-slate-400 hover:bg-brand-panel hover:text-slate-100'}`}>Software</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { card, SectionTitle } from '../../posturesync/Shared'
import { Icon } from '../../dashboard/Icon'

const inputClass = 'mt-2 w-full rounded-2xl border border-slate/30 bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-mauve'
const labelClass = 'block text-sm font-semibold text-muted'

function PasswordField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false)
  return <label className={labelClass}>{label}<span className="relative block"><input type={visible ? 'text' : 'password'} value={value} onChange={onChange} autoComplete="off" className={`${inputClass} pr-11`} /><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? `Hide ${label}` : `Show ${label}`} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted transition hover:bg-mauve/10 hover:text-mauve"><Icon name={visible ? 'eye-off' : 'eye'} size={16} strokeWidth={2.2} /></button></span></label>
}

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [alertMode, setAlertMode] = useState('hardware')
  const [personalMessage, setPersonalMessage] = useState(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState(null)

  useEffect(() => {
    window.electronAPI?.getAppSettings?.().then((settings) => {
      setDisplayName(settings?.displayName || '')
      setEmail(settings?.email || '')
      setDateOfBirth(settings?.dateOfBirth || '')
      setAlertMode(settings?.alertMode === 'software' ? 'software' : 'hardware')
    })
  }, [])

  const saveSettings = async (nextSettings) => {
    const settings = await window.electronAPI?.saveAppSettings?.(nextSettings)
    if (settings) {
      setDisplayName(settings.displayName || '')
      setEmail(settings.email || '')
      setDateOfBirth(settings.dateOfBirth || '')
      setAlertMode(settings.alertMode)
      return true
    }
    return false
  }

  const savePersonalInfo = async (event) => {
    event.preventDefault()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setPersonalMessage({ type: 'error', text: 'Enter a valid email address.' })
      return
    }
    const saved = await saveSettings({ displayName, email, dateOfBirth, alertMode })
    setPersonalMessage(saved ? { type: 'success', text: 'Saved.' } : { type: 'error', text: 'Could not save.' })
  }

  const updatePassword = (event) => {
    event.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Complete all password fields.' })
    } else if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: "Passwords don't match." })
    } else {
      setPasswordMessage({ type: 'success', text: 'Validated locally. Password is not stored.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const toggleAlertMode = async () => {
    const nextMode = alertMode === 'hardware' ? 'software' : 'hardware'
    setAlertMode(nextMode)
    await saveSettings({ displayName, email, dateOfBirth, alertMode: nextMode })
  }

  return <div className="tab-scroll mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-6 overflow-y-auto"><div className="flex-none"><p className="text-xs font-bold uppercase tracking-wider text-mauve">Application</p><h1 className="mt-1 font-display text-2xl font-bold text-navy">Settings</h1><p className="mt-2 text-sm text-muted">Configure your profile and posture alert behavior.</p></div><div className="grid min-h-0 flex-1 gap-6 pb-2"><section className={`${card} settings-card flex-none`}><SectionTitle eyebrow="Profile" title="Personal Info" /><form onSubmit={savePersonalInfo} className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Enter your name" className={inputClass} /></label><label className={labelClass}>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className={inputClass} /></label><label className={labelClass}>Date of Birth<input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className={inputClass} /></label><div className="flex items-end gap-3"><button type="submit" className="rounded-full bg-mauve px-5 py-2.5 text-sm font-bold text-offwhite transition hover:bg-navy">Save Personal Info</button>{personalMessage && <span role="status" className={`text-sm ${personalMessage.type === 'error' ? 'text-status-bad' : 'text-status-good'}`}>{personalMessage.text}</span>}</div></form></section><section className={`${card} settings-card flex-none`}><SectionTitle eyebrow="Profile" title="Change Password" /><form onSubmit={updatePassword} className="grid gap-4 sm:grid-cols-3"><PasswordField label="Current Password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /><PasswordField label="New Password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><PasswordField label="Confirm New Password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /><div className="flex items-center gap-3 sm:col-span-3"><button type="submit" className="rounded-full bg-mauve px-5 py-2.5 text-sm font-bold text-offwhite transition hover:bg-navy">Update Password</button>{passwordMessage && <span role="status" className={`text-sm ${passwordMessage.type === 'error' ? 'text-status-bad' : 'text-status-good'}`}>{passwordMessage.text}</span>}</div></form><p className="mt-3 text-xs text-muted">Password changes are validated locally for now and are never logged or persisted as plaintext.</p></section><section className={`${card} settings-card flex-none`}><SectionTitle eyebrow="App Configuration" title="Posture alert mode" /><div className="flex flex-col gap-4"><div><p className="text-sm font-semibold text-foreground">{alertMode === 'hardware' ? 'Hardware Mode' : 'Software Mode'}</p><p className="mt-1 text-sm text-muted">{alertMode === 'hardware' ? 'Use native OS notifications and notification history.' : 'Use the fullscreen posture overlay only.'}</p></div><div role="group" aria-label="Posture alert mode" className="relative inline-flex w-fit shrink-0 rounded-full border border-slate/30 bg-surface p-1"><span aria-hidden="true" className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-mauve transition-transform duration-200 ease-out ${alertMode === 'software' ? 'translate-x-full' : 'translate-x-0'}`} /><button type="button" aria-pressed={alertMode === 'hardware'} onClick={() => alertMode !== 'hardware' && toggleAlertMode()} className={`relative z-10 min-w-24 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve ${alertMode === 'hardware' ? 'text-offwhite' : 'text-muted hover:bg-slate/10'}`}>Hardware</button><button type="button" aria-pressed={alertMode === 'software'} onClick={() => alertMode !== 'software' && toggleAlertMode()} className={`relative z-10 min-w-24 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve ${alertMode === 'software' ? 'text-offwhite' : 'text-muted hover:bg-slate/10'}`}>Software</button></div></div></section></div></div>
}

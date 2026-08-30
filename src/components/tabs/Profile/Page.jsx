import { useState } from 'react'
import { card, MockInput, SectionTitle, Toggle } from '../../posturesync/Shared'

export default function ProfilePage({ data, darkMode, onThemeChange, onProfileNameChange }) {
  const [name, setName] = useState(data.user.name)
  const [email, setEmail] = useState(data.user.email)
  const updateName = (event) => { const value = event.target.value; setName(value); onProfileNameChange(value) }
  return <div className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-wider text-[#8eb69b]">Profile</p><h1 className="mt-1 text-2xl font-bold">Profile & preferences</h1><p className="mt-2 text-sm text-[#8eb69b]">Personal account and interface settings.</p></div><section className={card}><SectionTitle eyebrow="Account" title="Profile details" /><div className="grid gap-5 md:grid-cols-2"><MockInput label="Name" value={name} onChange={updateName} /><MockInput label="Email" value={email} onChange={(event) => setEmail(event.target.value)} /></div></section><section className={card}><SectionTitle eyebrow="Appearance" title="Theme" /><div className="flex items-center justify-between rounded-xl border border-[#235347] bg-[#051f20] p-4"><div><p className="font-bold">{darkMode ? 'Dark mode' : 'Light mode'}</p><p className="mt-1 text-xs text-[#8eb69b]">Switch the interface palette.</p></div><Toggle enabled={darkMode} onChange={onThemeChange} /></div></section></div>
}

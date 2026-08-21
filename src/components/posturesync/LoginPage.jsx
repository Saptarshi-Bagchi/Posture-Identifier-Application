import { useState } from 'react'
import logoSrc from '../../assets/postureguard-logo.png'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    if (username === 'admin' && password === 'admin') onLogin()
    else setError('Invalid username or password')
  }
  return <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#172033,#0b1120_58%)] p-5 text-slate-100"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-2xl shadow-black/30"><div className="text-center"><img src={logoSrc} alt="PostureGuard" className="mx-auto h-16 w-16 rounded-2xl object-cover" /><p className="mt-5 text-2xl font-bold">Posture<span className="text-brand-cyan">Guard</span></p><p className="mt-1 text-sm text-slate-400">Precision Health</p></div><div className="mt-8 space-y-4"><label className="block text-xs font-semibold text-slate-400">Username<input placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-xl border border-brand-border bg-brand-navy px-4 py-3 text-sm text-slate-100 outline-none focus:border-brand-cyan" /></label><label className="block text-xs font-semibold text-slate-400">Password<input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-brand-border bg-brand-navy px-4 py-3 text-sm text-slate-100 outline-none focus:border-brand-cyan" /></label></div>{error && <p className="mt-4 rounded-xl bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300">{error}</p>}<button type="submit" className="mt-6 w-full rounded-xl bg-brand-gradient px-4 py-3 text-sm font-bold text-brand-navy transition hover:brightness-110">Log In</button><button type="button" className="mt-4 w-full text-center text-xs text-slate-400 hover:text-brand-cyan">Forgot password?</button></form></main>
}

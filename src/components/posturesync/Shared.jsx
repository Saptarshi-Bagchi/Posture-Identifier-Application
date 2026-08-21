import { Icon } from '../dashboard/Icon'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'

export const card = 'rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-lg shadow-brand-navy/20'
export const lightCard = 'rounded-2xl border border-[#d8e9e1] bg-white p-5 shadow-sm'
export const statusColors = { good: 'text-status-good', aware: 'text-status-warn', poor: 'text-orange-400', bad: 'text-status-bad' }

export function SectionTitle({ eyebrow, title, action }) {
  return <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8eb69b]">{eyebrow}</p><h2 className="mt-1 text-lg font-bold">{title}</h2></div>{action}</div>
}

export function Toggle({ enabled, onChange }) {
  return <button type="button" onClick={() => onChange(!enabled)} className={`relative h-6 w-11 rounded-full transition ${enabled ? 'bg-brand-cyan' : 'bg-brand-border'}`} aria-label="Toggle setting"><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${enabled ? 'left-6' : 'left-1'}`} /></button>
}

export function StatTile({ label, value, detail, tone = 'good', icon = 'chart' }) {
  return <div className={`${card} flex items-start justify-between gap-3`}><div><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p><p className={`mt-1 text-[11px] ${statusColors[tone]}`}>{detail}</p></div><span className="rounded-xl bg-brand-panel p-2 text-brand-cyan"><Icon name={icon} size={18} /></span></div>
}

export function LineChartCard({ title, data, dataKeys = ['score'], colors = ['#22D3EE'], xKey = 'day' }) {
  return <div className={card}><SectionTitle eyebrow="Performance" title={title} /><div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 8, left: -25, bottom: 0 }}><CartesianGrid stroke="#235347" strokeDasharray="3 3" vertical={false} /><XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fill: '#8eb69b', fontSize: 10 }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#8eb69b', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#163832', border: '1px solid #235347', borderRadius: 10, color: '#daf1de' }} />{dataKeys.map((key, index) => <Line key={key} type="monotone" dataKey={key} stroke={colors[index]} strokeWidth={2.5} dot={{ r: 3, fill: colors[index], strokeWidth: 0 }} />)}</LineChart></ResponsiveContainer></div></div>
}

export function MockInput({ label, value, type = 'text', onChange }) {
  return <label className="block text-xs font-semibold text-slate-400">{label}<input type={type} value={value} onChange={onChange} className="mt-2 w-full rounded-xl border border-brand-border bg-brand-navy px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-brand-cyan" /></label>
}

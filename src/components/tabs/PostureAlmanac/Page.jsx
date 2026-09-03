// ------------------------- IMPORTS -------------------------
import { useState } from 'react'
import { Icon } from '../../dashboard/Icon'
import { card, SectionTitle, statusColors } from '../../posturesync/Shared'

// ------------------------- POSTURE IMAGE -------------------------
function PostureImage({ images, imageName, name, darkMode }) { const [failed, setFailed] = useState(false); const image = images[darkMode ? 'dark' : 'light']; return failed ? <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-status-warn bg-brand-navy p-3 text-center text-xs text-status-warn">Missing image: {imageName}</div> : <div className="flex h-40 items-center justify-center rounded-xl border border-brand-border bg-brand-navy p-3"><img src={image} alt={`${name} posture`} onError={() => setFailed(true)} className="max-h-36 max-w-full rounded-lg object-contain" /></div> }

// ------------------------- POSTURE ALMANAC PAGE -------------------------
export default function PostureAlmanacPage({ data, darkMode }) {
  return <div className="space-y-6"><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{data.postureAlmanac.map((item) => <article key={item.logic} className={`${card} overflow-hidden`}><div className="flex items-center justify-between"><span className={`text-xs font-bold uppercase ${statusColors[item.tone]}`}>● {item.tone}</span></div><div className="mt-3"><PostureImage images={item.images} imageName={item.imageName} name={item.name} darkMode={darkMode} /></div><h2 className="mt-4 text-lg font-bold">{item.name}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p><code className="mt-4 inline-flex rounded-lg border border-brand-border bg-brand-navy px-2.5 py-1.5 text-[11px] text-brand-yellow">{item.logic}</code></article>)}</div><section className={card}><SectionTitle eyebrow="Sensor reference" title="Angle definitions & thresholds" action={<Icon name="book" size={22} />} /><p className="text-sm text-slate-400">The ESP32 sends two pitch and two roll angles. ISPA classifies them using the firmware thresholds.</p></section></div>
}

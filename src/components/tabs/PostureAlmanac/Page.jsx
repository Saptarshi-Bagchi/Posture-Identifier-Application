// ------------------------- IMPORTS -------------------------
import { useState } from 'react'
import { Icon } from '../../dashboard/Icon'
import { card, SectionTitle, statusColors } from '../../posturesync/Shared'

// ------------------------- POSTURE IMAGE -------------------------
function PostureImage({ images, imageName, name, darkMode }) { const [failed, setFailed] = useState(false); const image = images[darkMode ? 'dark' : 'light']; return failed ? <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-status-warn bg-brand-navy p-3 text-center text-xs text-status-warn">Missing image: {imageName}</div> : <div className="flex h-48 items-center justify-center rounded-xl border border-brand-border bg-brand-navy p-4"><img src={image} alt={`${name} posture`} onError={() => setFailed(true)} className="max-h-44 max-w-full rounded-lg object-contain" /></div> }

// ------------------------- POSTURE ALMANAC PAGE -------------------------
export default function PostureAlmanacPage({ data, darkMode }) {
  const renderCard = (item) => <article key={item.logic} className={`${card} almanac-card overflow-hidden`}><div className="flex items-center justify-between"><span className={`text-xs font-bold uppercase ${statusColors[item.tone]}`}>● {item.tone}</span></div><div className="mt-4"><PostureImage images={item.images} imageName={item.imageName} name={item.name} darkMode={darkMode} /></div><h2 className="mt-5 text-xl font-bold">{item.name}</h2><p className="mt-2 text-base leading-6 text-slate-400">{item.description}</p><code className="mt-5 inline-flex rounded-lg border border-brand-border bg-brand-navy px-3 py-2 text-xs text-brand-yellow">{item.logic}</code></article>

  return <div className="tab-scroll space-y-6 overflow-y-auto"><div className="almanac-row">{data.postureAlmanac.slice(0, 3).map(renderCard)}</div><div className="almanac-row">{data.postureAlmanac.slice(3, 6).map(renderCard)}</div><div className="almanac-row">{data.postureAlmanac.slice(6, 8).map(renderCard)}</div><section className={card}><SectionTitle eyebrow="Sensor reference" title="Angle definitions & thresholds" action={<Icon name="book" size={22} />} /><p className="text-sm text-slate-400">The ESP32 sends two pitch and two roll angles. I-SPA classifies them using the firmware thresholds.</p></section></div>
}

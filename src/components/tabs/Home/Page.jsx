import { Icon } from '../../dashboard/Icon'
import spineImage from '../../../assets/spine.png'

function HelixVisual() {
  const featureCard = (position, icon, title, description) => (
    <div className={`hero-feature-card absolute z-20 w-44 rounded-2xl border border-divider/30 bg-surface p-3 shadow-lg sm:w-48 sm:p-4 ${position}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon name={icon} size={16} strokeWidth={2.5} /></span>
      <h3 className="mt-2 text-xs font-bold text-foreground sm:text-sm">{title}</h3>
      <p className="mt-1 text-[10px] leading-4 text-muted sm:text-xs sm:leading-5">{description}</p>
    </div>
  )

  return (
    <div className="hero-visual relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-[2rem] border border-slate/20 bg-panel/70 p-3 sm:min-h-[440px] sm:p-4">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[22px] border-mauve/10" />
      <div className="hero-spine absolute inset-x-2 bottom-0 top-8 rounded-[1.5rem] bg-contain bg-bottom bg-no-repeat opacity-95 sm:inset-x-3 sm:top-12" style={{ backgroundImage: `url(${spineImage})`, backgroundSize: 'auto 100%' }} role="img" aria-label="Illustration of a spine in alignment" />
      <div className="absolute bottom-6 left-6 grid grid-cols-5 gap-2 opacity-30">{Array.from({ length: 20 }, (_, index) => <span key={index} className="h-1.5 w-1.5 rounded-full bg-mauve" />)}</div>
      <div className="hero-status-badge absolute right-6 top-6 z-20 flex items-center gap-2 rounded-full border border-mauve/30 bg-mauve px-3 py-1.5 text-xs font-bold text-offwhite"><span className="h-2 w-2 rounded-full bg-offwhite" /> On track</div>
      {featureCard('left-2 top-12 sm:left-4 sm:top-16', 'exercises', 'Real-Time Alignment', 'Sensors track your spine’s angle continuously and catch slouching as it starts.')}
      {featureCard('right-2 top-1/2 -translate-y-1/2 sm:right-4', 'wifi', 'Seamless Connection', 'Pairs directly with your ESP sensor over USB, no setup hassle.')}
      {featureCard('left-8 bottom-8 sm:left-12 sm:bottom-10', 'history', 'Track Your Progress', 'See trends in your posture over time and build better habits daily.')}
      <div className="hero-signal-badge absolute bottom-4 right-6 z-20 flex items-center gap-2 rounded-full border border-divider/30 bg-surface px-3 py-2 text-[10px] font-semibold text-muted shadow-lg"><span className="h-2 w-2 rounded-full bg-accent" /> Real-time posture signal</div>
    </div>
  )
}

function PillButton({ children, icon, onClick, variant = 'primary' }) {
  const styles = variant === 'primary' ? 'bg-navy text-offwhite hover:bg-mauve' : 'border border-navy text-navy hover:bg-navy hover:text-offwhite'
  return <button type="button" onClick={onClick} className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve focus-visible:ring-offset-2 ${styles}`}><span className={`rounded-full p-1.5 ${variant === 'primary' ? 'bg-offwhite/10' : 'bg-navy/10'}`}><Icon name={icon} size={15} strokeWidth={2.5} /></span>{children}</button>
}

function HomeSections() {
  const steps = [['01', 'Connect your sensor', 'Connect your ESP32 over USB in a few simple steps.'], ['02', 'Track in real time', 'See your neck and lumbar angles as you sit and work.'], ['03', 'Build better habits', 'Get gentle awareness and use your history to improve over time.']]
  return <section className="home-how section-match-height flex min-h-0 shrink-0 flex-col justify-center rounded-3xl border border-slate/20 bg-panel p-4 sm:p-6 lg:p-8"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-mauve">How it works</p><h2 className="mt-3 font-display text-2xl font-bold leading-tight text-navy sm:text-4xl">A calmer way to sit well.</h2><p className="mt-4 max-w-lg text-xs leading-5 text-slate">Three quiet steps turn posture awareness into a habit that fits your workday.</p></div><div className="mt-6 border-t border-slate/20">{steps.map(([number, title, description], index) => <article key={number} className={`relative grid min-w-0 gap-4 border-b border-slate/20 py-8 last:border-b-0 last:pb-0 md:grid-cols-[150px_minmax(0,1fr)] md:gap-8 ${index % 2 === 1 ? 'md:grid-cols-[minmax(0,1fr)_150px] md:text-right' : ''}`}><span aria-hidden="true" className={`font-display text-7xl font-bold leading-none text-mauve/35 ${index % 2 === 1 ? 'md:col-start-2 md:row-start-1' : ''}`}><span className="hidden md:inline">{number}</span><span className="md:hidden">{number.replace(/^0/, '')}</span></span><div className={`${index % 2 === 1 ? 'md:col-start-1 md:row-start-1 md:pr-8' : 'md:col-start-2 md:pl-8'}`}><h3 className="font-display text-2xl font-bold text-navy sm:text-3xl">{title}</h3><p className={`mt-3 max-w-md text-sm leading-6 text-slate md:max-w-lg ${index % 2 === 1 ? 'md:ml-auto' : ''}`}>{description}</p></div></article>)}</div></section>
}

export default function HomePage({ onNavigate }) {
  return (
    <div className="home-page tab-scroll themed-scroll flex min-h-full flex-col gap-4 overflow-y-auto pb-4">
      <section className="home-hero section-match-height hero-section relative grid flex-1 items-center gap-8 overflow-hidden rounded-[2rem] border border-slate/20 bg-offwhite p-5 sm:p-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] lg:p-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border-[26px] border-mauve/10" />
        <div className="relative z-10 min-w-0">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-mauve/25 bg-mauve/10 px-3 py-1.5 text-xs font-bold text-mauve"><span className="h-2 w-2 rounded-full bg-mauve" /> Your daily posture companion</p>
          <h1 className="hero-headline max-w-xl font-display font-extrabold tracking-tight text-navy">Sit right.<br />Feel right.<br /><span className="text-mauve">Every time.</span></h1>
          <p className="hero-description mt-3 max-w-md text-slate sm:mt-4">I-SPA watches your alignment in real time and gives you a gentle nudge before a small slouch becomes a long day of tension.</p>
          <div className="hero-actions mt-4 flex flex-wrap gap-3 sm:mt-6"><PillButton icon="wifi" onClick={() => onNavigate('Device Connection')}>Start Tracking</PillButton><PillButton icon="book" variant="secondary" onClick={() => onNavigate('Posture Almanac')}>Learn More</PillButton></div>
          <div className="hero-stats mt-4 flex flex-wrap border-t border-slate/20 px-1 pt-3 sm:mt-7 sm:pt-4"><div className="rounded-2xl border border-slate/20 bg-surface/40"><p className="font-display text-xl font-bold text-mauve sm:text-2xl">24/7</p><p className="text-xs font-semibold text-slate">gentle awareness</p></div><div className="rounded-2xl border border-slate/20 bg-surface/40"><p className="font-display text-xl font-bold text-mauve sm:text-2xl">4</p><p className="text-xs font-semibold text-slate">live angle signals</p></div></div>
        </div>
        <HelixVisual />
      </section>
      <HomeSections /><section className="home-team section-match-height flex min-h-0 shrink-0 flex-col justify-center rounded-3xl border border-slate/20 bg-panel px-4 pt-4 pb-0 sm:px-6 sm:pt-6 sm:pb-0 lg:px-8 lg:pt-8 lg:pb-0"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-mauve">Our team</p><h2 className="mt-3 font-display text-2xl font-bold leading-tight text-navy sm:text-4xl">The people behind I-SPA.</h2><p className="mt-3 max-w-lg text-xs leading-5 text-slate">A small team building tools to help people sit, stand, and move better.</p></div><div className="mx-auto mt-8 w-full max-w-5xl divide-y divide-slate/20 border-t border-slate/20">{[['SB', 'Sainandan Bose', 'Lead Hardware Architect'], ['MJA', 'Mohammed Junaid Abedin', 'Embedded and IoT engineer'], ['SB', 'Saptarshi Bagchi', 'Software Developer'], ['SU', 'Shobhini Upadhyay', 'Public Relationship Manager'], ['SG', 'Sayan Ghosh', 'UI/UX Designer'], ['TB', 'Tejaswini Baral', 'Lead Researcher']].map(([initials, name, role]) => <article key={name} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"><div className="flex min-w-0 items-center gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mauve/15 font-display text-[11px] font-bold text-mauve">{initials}</div><h3 className="font-display text-base font-bold tracking-tight text-navy sm:text-lg">{name}</h3></div><p className="pl-12 text-xs font-bold uppercase tracking-[0.12em] text-mauve sm:pl-0">{role}</p></article>)}</div></section>
    </div>
  )
}

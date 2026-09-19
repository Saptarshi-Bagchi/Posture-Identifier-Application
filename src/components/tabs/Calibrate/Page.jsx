import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { Icon } from '../../dashboard/Icon'
import { analyzePose } from '../../../lib/postureDetection'

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
const poseModel = new URL('../../../../models/pose_landmarker_lite.task', import.meta.url).href
const wasmBasePath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const dailyAdvice = [
  'Raise your screen to eye level and let your chin stay gently tucked.',
  'Relax both shoulders away from your ears before returning to work.',
  'Place both feet firmly on the floor and keep your hips evenly supported.',
  'Use a small lumbar support and avoid collapsing into the back of the chair.',
  'Take three slow breaths while lengthening the crown of your head upward.',
  'Keep your keyboard close so your elbows can rest near your sides.',
  'Stand and walk briefly before stiffness encourages you to lean forward.',
  'Keep your phone higher rather than bending your neck down toward it.',
  'Reset your shoulder blades gently instead of pulling them tightly backward.',
  'Alternate your sitting and standing positions before one posture becomes tiring.',
  'Keep your ribcage relaxed over your pelvis during each posture check.',
  'Move your chair close enough that you do not reach or round your back.',
  'Let your eyes move toward the screen while your neck stays aligned.',
  'During walking, look ahead and keep your head balanced over your trunk.',
  'Pause at the end of each hour for a gentle full-body alignment reset.',
  'Avoid crossing the same leg for long periods; switch positions regularly.',
  'Keep both shoulders level while reaching, typing, or carrying light objects.',
  'Use a supported sitting position for focused tasks instead of perching forward.',
  'Breathe slowly into your lower ribs while maintaining a comfortable upright stance.',
  'Check that your chair height lets your knees remain close to hip level.',
  'Keep your walking stride easy and avoid leading with your head or shoulders.',
  'Place frequently used items nearby so you do not twist repeatedly to reach them.',
  'Let your lower back keep its natural curve without forcing it into position.',
  'When standing, distribute weight across both feet instead of leaning to one side.',
  'Take a short movement break after long screen sessions before resuming work.',
  'Keep your monitor centered so your neck does not rotate for extended periods.',
  'Use a relaxed jaw and steady breathing to reduce tension through your neck.',
  'Sit back with support while keeping your chest open and shoulders easy.',
  'Notice early fatigue and change position before your posture begins to collapse.',
  'End the day with one calm alignment check and carry that awareness into tomorrow.',
]

function MonthlyCalendar({ calendar }) {
  const firstDate = calendar[0]?.date ? new Date(`${calendar[0].date}T00:00:00Z`) : null
  const leadingBlankDays = firstDate && !Number.isNaN(firstDate.getTime()) ? (firstDate.getUTCDay() + 6) % 7 : 0
  const cells = [...Array.from({ length: leadingBlankDays }, () => null), ...calendar]
  const routineDayCount = cells.filter(Boolean).length
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return <>
    <p className="mt-4 w-fit rounded-full border border-mauve/25 bg-mauve/10 px-3 py-1.5 text-sm font-bold text-mauve">{routineDayCount}-Day Correction Plan</p>
    <div className="mt-3 flex min-h-0 flex-1 flex-col">
      <div className="flex-none grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted sm:gap-2 sm:text-xs">{weekdays.map((weekday) => <span key={weekday} className="truncate">{weekday.slice(0, 3)}</span>)}</div>
      <div className="calibrate-calendar-grid mt-2 grid min-h-0 flex-1 grid-cols-7 auto-rows-fr gap-1.5 sm:gap-2">{cells.map((day, index) => day ? <article key={day.date} tabIndex="0" aria-label={`${day.date}, target angle ${day.targetAngle} degrees`} className={`calendar-day group relative min-h-0 rounded-xl border border-divider/25 bg-white p-1.5 outline-none transition hover:z-10 hover:border-mauve focus:z-10 focus:border-mauve sm:min-h-0 sm:p-2 ${index % 7 === 6 ? 'calendar-sunday' : ''}`}><div className="flex items-start justify-between gap-1"><span className="font-display text-lg font-bold leading-none text-foreground sm:text-xl">{day.date.slice(-2)}</span><span className="text-[9px] font-bold uppercase text-muted sm:text-[10px]">{new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(`${day.date}T00:00:00Z`))}</span></div><div className={`calendar-popup pointer-events-none absolute z-20 hidden w-72 max-w-[calc(100vw-2rem)] whitespace-normal break-words rounded-xl border border-divider/30 p-4 text-left text-xs leading-5 text-foreground shadow-xl group-hover:block group-focus:block ${index < 7 ? 'top-full mt-3' : 'bottom-full mb-3'} ${index % 7 === 6 ? 'calendar-popup-sunday' : ''} ${index % 7 >= 5 ? 'right-0' : index % 7 === 0 ? 'left-0' : 'left-1/2 -translate-x-1/2'}`}><p className="font-bold text-mauve">Day {day.day} · {day.date}</p><p className="mt-4">Fix angle by {day.angleToRectify}° (towards {day.targetAngle}°)</p><p className="mt-4">{dailyAdvice[(Number(day.day) - 1) % dailyAdvice.length]}</p></div></article> : <span key={`blank-${index}`} aria-hidden="true" className="min-h-0 rounded-xl bg-transparent" />)}</div>
    </div>
  </>
}

function fallbackCalendar(angle, startDate) {
  const days = Math.max(3, Math.min(30, Math.ceil(Math.abs(Number(angle)) * 1.5)))
  const dailyCorrection = Math.max(0.1, Number((angle / days).toFixed(2)))
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(`${startDate}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + index)
    const targetAngle = Math.max(0, Number((angle - dailyCorrection * (index + 1)).toFixed(2)))
    return {
      day: index + 1,
      date: date.toISOString().slice(0, 10),
      angleToRectify: Number((angle - targetAngle).toFixed(2)),
      targetAngle,
      postureTips: ['Keep your head stacked over your shoulders.', 'Reset gently during sitting, standing, and walking.'],
      avoid: ['Avoid holding one fixed position for long periods.'],
      discipline: 'Take a brief posture reset and check your alignment before continuing.',
    }
  })
}

export default function CalibratePage() {
  const inputRef = useRef(null)
  const landmarkerRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState('')
  const [aiPlanAvailable, setAiPlanAvailable] = useState(null)

  useEffect(() => () => { landmarkerRef.current?.close() }, [])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  useEffect(() => {
    const statusRequest = window.electronAPI?.getAiPlanStatus?.()
    if (!statusRequest) {
      setAiPlanAvailable(null)
      return
    }
    statusRequest.then((status) => setAiPlanAvailable(Boolean(status?.available))).catch(() => setAiPlanAvailable(null))
  }, [])

  const chooseFile = (nextFile) => {
    setResult(null)
    setError('')
    setPlanError('')
    if (!nextFile) return
    if (!acceptedTypes.includes(nextFile.type)) {
      setError('Please choose a JPG, PNG, or WebP image.')
      return
    }
    setFile(nextFile)
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(nextFile)
    })
  }

  const resetCalibration = () => {
    setFile(null)
    setResult(null)
    setError('')
    setPlanError('')
    setPlanLoading(false)
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return ''
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const generatePlan = async (analysis) => {
    setPlanLoading(true)
    setPlanError('')
    try {
      let plan
      const startDate = new Date().toISOString().slice(0, 10)
      if (window.electronAPI?.generatePosturePlan) {
        plan = await window.electronAPI.generatePosturePlan({ angle: analysis.angle, category: analysis.category, startDate })
      } else {
        const response = await fetch('/api/generate-posture-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ angle: analysis.angle, category: analysis.category, startDate }) })
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) throw new Error(`Plan service returned an unexpected response (${response.status}).`)
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Unable to generate the improvement plan.')
        plan = payload
      }
      const calendar = Array.isArray(plan?.calendar) ? plan.calendar : []
      const usableCalendar = calendar.length >= 1 && calendar.length <= 30 && calendar.every((day) => (
        day && day.date && Number.isFinite(Number(day.angleToRectify)) && Number.isFinite(Number(day.targetAngle)) && Array.isArray(day.postureTips) && Array.isArray(day.avoid) && day.discipline
      ))
      const nextCalendar = usableCalendar ? calendar : fallbackCalendar(analysis.angle, startDate)
      setResult((current) => current?.angle === analysis.angle ? { ...current, calendar: nextCalendar } : current)
    } catch (planGenerationError) {
      setPlanError(planGenerationError instanceof Error ? planGenerationError.message : 'Unable to generate the improvement plan.')
    } finally {
      setPlanLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file) {
      setError('Select an image before analyzing posture.')
      return
    }
    setProcessing(true)
    setError('')
    setPlanError('')
    setResult(null)
    try {
      if (!landmarkerRef.current) {
        const vision = await FilesetResolver.forVisionTasks(wasmBasePath)
        landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: poseModel }, runningMode: 'IMAGE', numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 })
      }
      const image = await createImageBitmap(file)
      const detection = landmarkerRef.current.detect(image)
      image.close()
      const landmarks = detection.landmarks?.[0]
      if (!landmarks) throw new Error('No person detected. Choose a clear, full-body image and try again.')
      const analysis = analyzePose(landmarks)
      if (!analysis) throw new Error('The pose landmarks were not clear enough. Try a brighter, more front-facing image.')
       setResult({ ...analysis, calendar: null, planSkipped: Number(analysis.angle) <= 10 })
       if (Number(analysis.angle) <= 10) return
       await generatePlan(analysis)
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'Unable to analyze this image. Please try another one.')
    } finally {
      setProcessing(false)
    }
  }

  return <div className="tab-scroll calibrate-page themed-scroll h-full min-h-0 overflow-y-auto px-2"><section className="calibrate-shell mx-auto w-full max-w-7xl rounded-3xl border border-slate/20 bg-surface p-3 sm:p-4 lg:p-5"><header><h1 className="font-display text-xl font-bold leading-tight text-navy sm:text-3xl">Analyze Posture</h1><p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">Upload a posture image to measure the neck-to-hip angle and generate an adaptive posture routine.</p></header><div className="calibrate-columns mt-4 grid min-w-0 items-stretch gap-4 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]"><div className="calibrate-analysis flex min-w-0 flex-col"><form onSubmit={handleSubmit} className="calibrate-form flex h-full flex-col"><input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />{!file && <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]) }} className={`flex min-h-40 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-4 py-6 text-center transition ${dragging ? 'border-mauve bg-mauve/10' : 'border-divider/40 bg-panel/40 hover:border-mauve hover:bg-mauve/5'}`}><span className="flex h-12 w-12 items-center justify-center rounded-full bg-mauve/15 text-mauve"><Icon name="upload" size={26} strokeWidth={2.2} /></span><span className="mt-3 font-display text-lg font-bold text-navy">Add an image to analyze</span><span className="mt-2 text-sm text-muted">Drag and drop an image, or click to browse</span><span className="mt-1 text-xs text-muted">JPG, PNG, or WebP</span></button>}{preview && <div className="calibrate-preview mt-3 flex min-h-0 flex-1 flex-col rounded-2xl border border-divider/25 bg-panel p-2"><img src={preview} alt="Selected posture image preview" className="h-full min-h-0 w-full max-h-20 rounded-xl object-contain lg:max-h-none" /><div className="mt-2"><button type="button" onClick={resetCalibration} className="rounded-full border border-mauve/50 px-4 py-2 text-sm font-bold text-mauve transition hover:bg-mauve hover:text-offwhite">Replace Image</button></div></div>}<div className="calibrate-result-slot mt-3">{error && <p role="alert" className="text-sm font-semibold text-status-bad">{error}</p>}{result && <div className="rounded-2xl border border-divider/30 bg-panel p-3"><div className="flex min-w-0 flex-nowrap items-center justify-between gap-3"><p className="min-w-0 truncate text-sm font-bold text-muted">Posture analysis result: {result.angle}°</p><span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${result.verdict === 'Good posture' ? 'bg-mauve text-offwhite' : 'bg-status-bad text-offwhite'}`}>{result.verdict}</span></div></div>}</div><div className="mt-3"><button type="submit" className="rounded-full bg-mauve px-5 py-2.5 text-sm font-bold text-offwhite transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50" disabled={!file || processing}>{processing ? 'Analyzing…' : 'Analyze Posture'}</button></div></form></div><aside className="calibrate-calendar flex min-w-0 flex-col rounded-3xl border border-divider/25 bg-panel p-3 sm:p-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-mauve">Adaptive posture routine</p><p className="mt-2 text-sm leading-relaxed text-muted">Hover or focus a calendar date to see its target correction and the habit discipline for that day.</p></div>{result && Number(result.angle) <= 10 ? <div className="calibrate-healthy-range mt-5 flex min-h-0 flex-1 items-center rounded-2xl border border-divider/20 bg-surface/60 p-6 text-sm leading-relaxed text-muted">Your posture angle is within a healthy range — no correction routine is needed right now.</div> : <>{planLoading && <p className="mt-4 rounded-2xl border border-divider/20 bg-surface/60 p-4 text-sm text-muted">Building your adaptive routine…</p>}{planError && <p role="alert" className="mt-4 rounded-2xl border border-status-bad/30 bg-status-bad/10 p-4 text-sm font-semibold text-status-bad">{planError}</p>}{result?.calendar ? <MonthlyCalendar calendar={result.calendar} /> : !planLoading && !planError && <div className="mt-4 rounded-2xl border border-dashed border-divider/30 bg-surface/40 p-6 text-sm leading-relaxed text-muted">Analyze an image to generate the recommended posture routine.</div>}</>}</aside></div></section></div>
}

import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { Icon } from '../../dashboard/Icon'

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
const poseModel = new URL('../../../../models/pose_landmarker_lite.task', import.meta.url).href
const wasmBasePath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'

function averagePoint(points) {
  return points.reduce((result, point) => ({ x: result.x + point.x / points.length, y: result.y + point.y / points.length }), { x: 0, y: 0 })
}

function analyzePose(landmarks) {
  const required = [landmarks[11], landmarks[12], landmarks[23], landmarks[24]]
  if (required.some((point) => !point || (point.visibility ?? 1) < 0.5)) return null
  const shoulder = averagePoint([landmarks[11], landmarks[12]])
  const hip = averagePoint([landmarks[23], landmarks[24]])
  const horizontalOffset = hip.x - shoulder.x
  const verticalOffset = hip.y - shoulder.y
  if (!Number.isFinite(horizontalOffset) || !Number.isFinite(verticalOffset) || !verticalOffset) return null
  // The y-axis is true image vertical; using atan2(horizontal, vertical) keeps 0° upright.
  const angle = Math.round((Math.atan2(Math.abs(horizontalOffset), Math.abs(verticalOffset)) * 180) / Math.PI)
  // Initial tuning for the shoulder-midpoint-to-hip-midpoint angle: <=8° is neutral,
  // 9–18° is a mild/moderate forward-lean pattern, and >18° is more pronounced.
  const category = angle <= 8 ? 'POSTURE_NEUTRAL_GOOD' : angle <= 18 ? 'POSTURE_FORWARD_HEAD_TEXT_NECK' : 'POSTURE_KYPHOSIS_UPPER_HUNCH'
  return { angle, category, verdict: angle <= 8 ? 'Good posture' : 'Slouching detected' }
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
    window.electronAPI?.getAiPlanStatus?.().then((status) => setAiPlanAvailable(Boolean(status?.available))).catch(() => setAiPlanAvailable(false))
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
      if (aiPlanAvailable === false) throw new Error('AI plan generation requires an API key — check your .env file.')
      const plan = await window.electronAPI?.generatePosturePlan?.({ angle: analysis.angle, category: analysis.category })
      if (!Array.isArray(plan) || plan.length !== 7) throw new Error('AI plan generation requires an API key — check your .env file.')
      setResult((current) => current?.angle === analysis.angle ? { ...current, plan } : current)
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
      setResult({ ...analysis, plan: null })
      await generatePlan(analysis)
    } catch (processingError) {
      setError(processingError instanceof Error ? processingError.message : 'Unable to analyze this image. Please try another one.')
    } finally {
      setProcessing(false)
    }
  }

  return <div className="tab-scroll h-full min-h-0 overflow-y-auto pr-1"><section className="mx-auto max-w-3xl rounded-3xl border border-slate/20 bg-surface p-6 sm:p-10"><h1 className="font-display text-4xl font-bold leading-tight text-navy sm:text-5xl">Analyze Posture</h1><form onSubmit={handleSubmit} className="mt-6"><input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />{!file && <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]) }} className={`flex min-h-52 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${dragging ? 'border-mauve bg-mauve/10' : 'border-divider/40 bg-panel/40 hover:border-mauve hover:bg-mauve/5'}`}><span className="flex h-14 w-14 items-center justify-center rounded-full bg-mauve/15 text-mauve"><Icon name="upload" size={26} strokeWidth={2.2} /></span><span className="mt-4 font-display text-xl font-bold text-navy">Add an image to analyze</span><span className="mt-2 text-sm text-muted">Drag and drop an image, or click to browse</span><span className="mt-1 text-xs text-muted">JPG, PNG, or WebP</span></button>}{preview && <div className="mt-5 rounded-2xl border border-divider/25 bg-panel p-3"><img src={preview} alt="Selected posture image preview" className="max-h-80 w-full rounded-xl object-contain" /><div className="mt-3 flex flex-col items-start gap-3"><p className="max-w-full truncate text-sm font-semibold text-foreground">{file.name}</p><button type="button" onClick={resetCalibration} className="rounded-full border border-mauve/50 px-4 py-2 text-sm font-bold text-mauve transition hover:bg-mauve hover:text-offwhite">Replace Image</button></div></div>}{error && <p role="alert" className="mt-3 text-sm font-semibold text-status-bad">{error}</p>}{result && <div className="mt-5 rounded-2xl border border-divider/30 bg-panel p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Posture analysis result</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><p className="font-display text-4xl font-bold text-navy">{result.angle}°</p><p className="mt-1 text-sm text-muted">Neck proxy (shoulder midpoint) to hip midpoint, from vertical</p></div><span className={`rounded-full px-4 py-2 text-sm font-bold ${result.verdict === 'Good posture' ? 'bg-mauve text-offwhite' : 'bg-status-bad text-offwhite'}`}>{result.verdict}</span></div></div>}{result && <div className="mt-5 space-y-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-mauve">7-day improvement plan</p><p className="mt-1 text-sm text-muted">Personalized from your measured shoulder-to-hip angle.</p></div>{aiPlanAvailable === false && <div className="rounded-2xl border border-divider/25 bg-panel p-4"><p className="text-sm font-semibold text-foreground">AI plan generation requires an API key — check your .env file.</p></div>}{planLoading && <div className="rounded-2xl border border-divider/25 bg-panel p-4"><p className="text-sm font-semibold text-foreground">Generating your personalized 7-day plan…</p></div>}{planError && aiPlanAvailable !== false && <div className="rounded-2xl border border-status-bad/30 bg-status-bad/10 p-4"><p role="alert" className="text-sm font-semibold text-status-bad">{planError}</p><button type="button" onClick={() => generatePlan(result)} className="mt-3 rounded-full border border-mauve/50 px-4 py-2 text-sm font-bold text-mauve transition hover:bg-mauve hover:text-offwhite">Retry plan</button></div>}{result.plan && result.plan.map(([focus, exercises, note], index) => <article key={`${index}-${focus}`} className="rounded-2xl border border-divider/25 bg-panel p-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-display text-lg font-bold text-navy">Day {index + 1}: {focus}</h3><span className="text-xs font-bold uppercase tracking-[0.12em] text-mauve">Daily focus</span></div><p className="mt-2 text-sm text-foreground">{exercises}</p><p className="mt-1 text-xs leading-5 text-muted">{note}</p></article>)}</div>}<div className="mt-6"><button type="submit" className="rounded-full bg-mauve px-6 py-3 text-sm font-bold text-offwhite transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50" disabled={!file || processing}>{processing ? 'Analyzing…' : 'Analyze Posture'}</button></div></form></section></div>
}

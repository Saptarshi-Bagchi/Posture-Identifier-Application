import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../dashboard/Icon'

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']

export default function CalibratePage({ onNavigate }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const chooseFile = (nextFile) => {
    setMessage('')
    if (!nextFile) return
    if (!acceptedTypes.includes(nextFile.type)) {
      setError('Please choose a JPG, PNG, or WebP image.')
      return
    }
    setError('')
    setFile(nextFile)
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(nextFile)
    })
  }

  const removeFile = () => {
    setFile(null)
    setError('')
    setMessage('')
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current)
      return ''
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!file) {
      setError('Select an image before calibrating.')
      return
    }
    // Placeholder integration point: connect this action to the calibration processor later.
    setMessage('Image ready for calibration.')
  }

  return <div className="tab-scroll h-full min-h-0 overflow-y-auto pr-1"><section className="mx-auto max-w-3xl rounded-3xl border border-slate/20 bg-surface p-6 sm:p-10"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-mauve">Calibration</p><h1 className="mt-2 font-display text-4xl font-bold leading-tight text-navy sm:text-5xl">Calibrate your view.</h1><p className="mt-4 text-sm leading-6 text-slate">Upload a clear image to prepare a personalized posture reference.</p></div><form onSubmit={handleSubmit} className="mt-8"><input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} /><button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]) }} className={`flex min-h-52 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${dragging ? 'border-mauve bg-mauve/10' : 'border-divider/40 bg-panel/40 hover:border-mauve hover:bg-mauve/5'}`}><span className="flex h-14 w-14 items-center justify-center rounded-full bg-mauve/15 text-mauve"><Icon name="upload" size={26} strokeWidth={2.2} /></span><span className="mt-4 font-display text-xl font-bold text-navy">{file ? 'Replace image' : 'Add a calibration image'}</span><span className="mt-2 text-sm text-muted">Drag and drop an image, or click to browse</span><span className="mt-1 text-xs text-muted">JPG, PNG, or WebP</span></button>{preview && <div className="mt-5 rounded-2xl border border-divider/25 bg-panel p-3"><img src={preview} alt="Selected calibration preview" className="max-h-80 w-full rounded-xl object-contain" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="min-w-0 truncate text-sm font-semibold text-foreground">{file.name}</p><button type="button" onClick={removeFile} className="rounded-full border border-mauve/50 px-4 py-2 text-sm font-bold text-mauve transition hover:bg-mauve hover:text-offwhite">Remove</button></div></div>}{error && <p role="alert" className="mt-3 text-sm font-semibold text-status-bad">{error}</p>}<div className="mt-6 flex flex-wrap items-center gap-3"><button type="submit" className="rounded-full bg-mauve px-6 py-3 text-sm font-bold text-offwhite transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50" disabled={!file}>Calibrate</button><button type="button" onClick={() => onNavigate('Live Posture')} className="rounded-full border border-navy px-6 py-3 text-sm font-bold text-navy transition hover:bg-navy hover:text-offwhite">Back to Live Posture</button>{message && <span role="status" className="text-sm font-semibold text-status-good">{message}</span>}</div></form></section></div>
}

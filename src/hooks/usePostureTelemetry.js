import { useEffect, useMemo, useState } from 'react'
import { classifyPosture } from '../config/postureRules'

const axes = ['neck_x', 'neck_y', 'lumbar_x', 'lumbar_y']
export const MAX_HISTORY_POINTS = 80

export function usePostureTelemetry() {
  const [telemetry, setTelemetry] = useState(null)
  const [status, setStatus] = useState({ listening: false, port: '', error: null })
  const [history, setHistory] = useState([])

  useEffect(() => {
    const api = window.electronAPI
    api?.getTelemetryStatus?.().then(setStatus)
    const removeTelemetry = api?.onPostureData?.((next) => {
      const values = [next?.neckX, next?.neckY, next?.lumbarX, next?.lumbarY]
      if (values.some((value) => !Number.isFinite(value))) return
      const telemetry = { neck_x: next.neckX, neck_y: next.neckY, lumbar_x: next.lumbarX, lumbar_y: next.lumbarY, good_posture: next.binary === 1, received_at: next.received_at || Date.now() }
      setTelemetry((previous) => ({ ...previous, ...telemetry }))
      const receivedAt = Date.now()
      const timestamp = telemetry.received_at || receivedAt
      const point = { time: new Date(timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }), timestamp, receivedAt, ...Object.fromEntries(axes.map((axis) => [axis, telemetry[axis]])) }
      setHistory((items) => [...items, point].slice(-MAX_HISTORY_POINTS))
    })
    const removeStatus = api?.onSerialStatus?.((next) => {
      setStatus(next)
      if (next?.connected === false || next?.listening === false) {
        setTelemetry(null)
        setHistory([])
      }
    })
    return () => { removeTelemetry?.(); removeStatus?.() }
  }, [])

  const classification = useMemo(() => telemetry ? classifyPosture(telemetry) : null, [telemetry])
  const goodPosture = telemetry?.good_posture ?? (classification?.tone === 'good' ? true : classification?.tone === 'poor' ? false : null)
  return { telemetry, status, history, classification, goodPosture }
}

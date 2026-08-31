import { useEffect, useMemo, useState } from 'react'
import { classifyPosture } from '../config/postureRules'

const axes = ['neck_x', 'neck_y', 'lumbar_x', 'lumbar_y']

export function usePostureTelemetry() {
  const [telemetry, setTelemetry] = useState(null)
  const [status, setStatus] = useState({ listening: false, host: '127.0.0.1', port: 1883, topic: 'posture/sensor_data', error: null })
  const [history, setHistory] = useState([])

  useEffect(() => {
    const api = window.electronAPI
    api?.getTelemetryStatus?.().then(setStatus)
    const removeTelemetry = api?.onTelemetry?.((next) => {
      if (!axes.every((axis) => Number.isFinite(next[axis]))) return
      setTelemetry(next)
      const receivedAt = Date.now()
      setHistory((items) => [...items, { time: new Date(next.received_at || next.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }), receivedAt, ...Object.fromEntries(axes.map((axis) => [axis, next[axis]])) }].filter((item) => receivedAt - item.receivedAt <= 60000))
    })
    const removeStatus = api?.onTelemetryStatus?.(setStatus)
    return () => { removeTelemetry?.(); removeStatus?.() }
  }, [])

  const classification = useMemo(() => telemetry ? classifyPosture(telemetry) : null, [telemetry])
  const goodPosture = telemetry?.good_posture ?? (classification?.tone === 'good' ? true : classification?.tone === 'poor' ? false : null)
  return { telemetry, status, history, classification, goodPosture }
}

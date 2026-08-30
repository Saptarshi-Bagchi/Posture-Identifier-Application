import { useEffect, useMemo, useState } from 'react'

const labels = {
  POSTURE_NEUTRAL_GOOD: 'Good posture',
  POSTURE_FORWARD_HEAD_TEXT_NECK: 'Forward head / text neck',
  POSTURE_CHAIR_SLOUCHING: 'Chair slouching',
  POSTURE_KYPHOSIS_UPPER_HUNCH: 'Upper back hunch',
  POSTURE_FORWARD_BODY_BEND: 'Forward body bend',
  POSTURE_RECLINED_LEANING_BACK: 'Reclined / leaning back',
  POSTURE_LATERAL_LEAN_SCOLIOTIC: 'Lateral lean',
  POSTURE_ASYMMETRIC_SLOUCH: 'Asymmetric slouch',
}

const formatAngle = (value) => Number.isFinite(value) ? `${value.toFixed(1)}°` : '—'

export function usePostureTelemetry(baseData) {
  const [packet, setPacket] = useState(null)
  const [status, setStatus] = useState({ listening: false, host: '127.0.0.1', port: 1883, error: null })
  const [stream, setStream] = useState(baseData.biometricStream)
  const [alerts, setAlerts] = useState(baseData.alerts)

  useEffect(() => {
    const api = window.electronAPI
    api?.getTelemetryStatus?.().then(setStatus)
    const removeTelemetry = api?.onTelemetry?.((next) => {
      setPacket(next)
      setStream((items) => [...items.slice(-29), { time: new Date(next.received_at || next.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }), neck: next.angle, back: next.angle }])
      if (next.posture_state !== 'POSTURE_NEUTRAL_GOOD') setAlerts((items) => [{ id: `${next.device_id}-${next.timestamp}`, type: labels[next.posture_state] || next.posture_state, description: `Angle: ${formatAngle(next.angle)}`, time: new Date(next.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), severity: 'poor' }, ...items].slice(0, 20))
    })
    const removeStatus = api?.onTelemetryStatus?.(setStatus)
    return () => { removeTelemetry?.(); removeStatus?.() }
  }, [baseData.alerts, baseData.biometricStream])

  const data = useMemo(() => {
    if (!packet) return { ...baseData, biometricStream: stream, alerts }
    const good = packet.posture_state === 'POSTURE_NEUTRAL_GOOD'
    return {
      ...baseData,
      device: { ...baseData.device, id: packet.device_id, connected: true, bluetooth: `MQTT · ${status.listening ? 'Connected' : 'Waiting'}` },
      telemetry: [
        { label: 'Device', value: packet.device_id, range: 'MQTT source', status: 'good' },
        { label: 'Posture state', value: labels[packet.posture_state] || packet.posture_state, range: good ? 'Within range' : 'Correction needed', status: good ? 'good' : 'poor' },
        { label: 'Angle', value: formatAngle(packet.angle), range: 'Reported by ESP32', status: good ? 'good' : 'poor' },
        { label: 'Updated', value: new Date(packet.received_at || packet.timestamp).toLocaleTimeString(), range: 'Latest packet', status: 'good' },
      ],
      biometricStream: stream,
      alerts,
    }
  }, [alerts, baseData, packet, status.listening, stream])
  return { data, packet, status, displayPosture: packet ? (labels[packet.posture_state] || packet.posture_state) : 'Waiting for telemetry' }
}

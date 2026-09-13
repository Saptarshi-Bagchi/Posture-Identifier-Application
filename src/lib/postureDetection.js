// ------------------------- POSTURE DETECTION -------------------------
export const POSTURE_THRESHOLDS = Object.freeze({
  goodAngle: 8,
  moderateAngle: 18,
})

export const SENSOR_THRESHOLDS = Object.freeze({
  goodAxis: 10,
  poorAxis: 20,
})

export function averagePoint(points) {
  return points.reduce((result, point) => ({
    x: result.x + point.x / points.length,
    y: result.y + point.y / points.length,
  }), { x: 0, y: 0 })
}

export function calculatePostureAngle(landmarks) {
  const required = [landmarks?.[11], landmarks?.[12], landmarks?.[23], landmarks?.[24]]
  if (required.some((point) => !point || (point.visibility ?? 1) < 0.5)) return null
  const shoulder = averagePoint([landmarks[11], landmarks[12]])
  const hip = averagePoint([landmarks[23], landmarks[24]])
  const horizontalOffset = hip.x - shoulder.x
  const verticalOffset = hip.y - shoulder.y
  if (!Number.isFinite(horizontalOffset) || !Number.isFinite(verticalOffset) || !verticalOffset) return null
  return Math.round((Math.atan2(Math.abs(horizontalOffset), Math.abs(verticalOffset)) * 180) / Math.PI)
}

export function classifyPosture(angle) {
  if (!Number.isFinite(angle)) return null
  if (angle <= POSTURE_THRESHOLDS.goodAngle) return { category: 'POSTURE_NEUTRAL_GOOD', verdict: 'Good posture', tone: 'good' }
  if (angle <= POSTURE_THRESHOLDS.moderateAngle) return { category: 'POSTURE_FORWARD_HEAD_TEXT_NECK', verdict: 'Slouching detected', tone: 'aware' }
  return { category: 'POSTURE_KYPHOSIS_UPPER_HUNCH', verdict: 'Slouching detected', tone: 'poor' }
}

export function analyzePose(landmarks) {
  const angle = calculatePostureAngle(landmarks)
  const classification = classifyPosture(angle)
  return classification ? { angle, ...classification } : null
}

// Sensor classification remains based on the four incoming axis angles, but
// lives beside image classification so both posture features share one module.
export function classifySensorPosture(reading) {
  const values = [reading?.neck_x, reading?.neck_y, reading?.lumbar_x, reading?.lumbar_y]
  const largest = Math.max(...values.map((value) => Math.abs(value)))
  if (largest <= SENSOR_THRESHOLDS.goodAxis) return { label: 'Good Posture', tone: 'good' }
  const direction = reading.neck_x < 0 || reading.lumbar_x < 0 ? 'Left' : 'Right'
  let label = reading.neck_y > SENSOR_THRESHOLDS.goodAxis ? 'Forward Head Tilt' : reading.neck_y < -SENSOR_THRESHOLDS.goodAxis ? 'Backward Head Tilt' : reading.lumbar_y > SENSOR_THRESHOLDS.goodAxis ? 'Slouched Lumbar' : `Leaning ${direction}`
  if (largest > SENSOR_THRESHOLDS.poorAxis) label = 'Poor Posture'
  return { label, tone: largest > SENSOR_THRESHOLDS.poorAxis ? 'poor' : 'aware' }
}

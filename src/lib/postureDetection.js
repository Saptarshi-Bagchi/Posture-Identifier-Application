// ------------------------- POSTURE DETECTION -------------------------
export const POSTURE_THRESHOLDS = Object.freeze({
  goodAngle: 8,
  moderateAngle: 18,
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

// Firmware-matched sensor classification. These rules are intentionally one
// ordered chain: the first matching posture owns the classification.
const SENSOR_POSTURE_PRESENTATION = Object.freeze({
  POSTURE_NEUTRAL_GOOD: { label: 'Good Posture', tone: 'good' },
  POSTURE_FORWARD_BODY_BEND: { label: 'Leaning Too Far Forward', tone: 'poor' },
  POSTURE_ASYMMETRIC_SLOUCH: { label: 'Asymmetric Slouch', tone: 'bad' },
  POSTURE_CHAIR_SLOUCHING: { label: 'Slouched Lumbar', tone: 'bad' },
  POSTURE_FORWARD_HEAD_TEXT_NECK: { label: 'Forward Head Tilt', tone: 'aware' },
  POSTURE_KYPHOSIS_UPPER_HUNCH: { label: 'Upper Back Hunch', tone: 'poor' },
  POSTURE_RECLINED_LEANING_BACK: { label: 'Backward Head Tilt', tone: 'aware' },
  POSTURE_LATERAL_LEAN_SCOLIOTIC: { label: 'Lateral Lean', tone: 'aware' },
  POSTURE_Bad: { label: 'Poor Posture', tone: 'poor' },
})

export function classifySensorPosture(reading) {
  const neck_x = Number(reading?.neck_x)
  const neck_y = Number(reading?.neck_y)
  const lumbar_x = Number(reading?.lumbar_x)
  const lumbar_y = Number(reading?.lumbar_y)
  if ([neck_x, neck_y, lumbar_x, lumbar_y].some((value) => !Number.isFinite(value))) return null

  const deltaPitch = neck_y - lumbar_y
  const deltaRoll = neck_x - lumbar_x
  let category
  if (Math.abs(lumbar_y) < 14 && Math.abs(neck_y) < 14) category = 'POSTURE_NEUTRAL_GOOD'
  else if (neck_y > 15) category = 'POSTURE_FORWARD_BODY_BEND'
  else if (neck_x > 15 && Math.abs(lumbar_x) > 10) category = 'POSTURE_ASYMMETRIC_SLOUCH'
  else if (lumbar_y > 15 && lumbar_y < 35) category = 'POSTURE_CHAIR_SLOUCHING'
  else if (lumbar_y < 15 && neck_y > 20 && deltaPitch > 15 && Math.abs(deltaRoll) < 8) category = 'POSTURE_FORWARD_HEAD_TEXT_NECK'
  else if (lumbar_y < 20 && deltaPitch > 25 && Math.abs(deltaRoll) < 8) category = 'POSTURE_KYPHOSIS_UPPER_HUNCH'
  else if (lumbar_y < -15 && neck_y < -15 && Math.abs(deltaPitch) < 15) category = 'POSTURE_RECLINED_LEANING_BACK'
  else if (Math.abs(lumbar_x) > 10 || Math.abs(neck_x) > 10) category = 'POSTURE_LATERAL_LEAN_SCOLIOTIC'
  else category = 'POSTURE_Bad'

  return { category, ...SENSOR_POSTURE_PRESENTATION[category] }
}

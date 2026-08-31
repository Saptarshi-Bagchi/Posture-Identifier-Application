export const postureRules = {
  goodAxisLimit: 10,
  mildAxisLimit: 20,
}

export function classifyPosture(reading) {
  const values = [reading.neck_x, reading.neck_y, reading.lumbar_x, reading.lumbar_y]
  const largest = Math.max(...values.map((value) => Math.abs(value)))
  if (largest <= postureRules.goodAxisLimit) return { label: 'Good Posture', tone: 'good' }
  const direction = reading.neck_x < 0 || reading.lumbar_x < 0 ? 'Left' : 'Right'
  let label = reading.neck_y > postureRules.goodAxisLimit ? 'Forward Head Tilt' : reading.neck_y < -postureRules.goodAxisLimit ? 'Backward Head Tilt' : reading.lumbar_y > postureRules.goodAxisLimit ? 'Slouched Lumbar' : `Leaning ${direction}`
  if (largest > postureRules.mildAxisLimit) label = 'Poor Posture'
  return { label, tone: largest > postureRules.mildAxisLimit ? 'poor' : 'aware' }
}

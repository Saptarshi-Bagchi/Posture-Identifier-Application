// ------------------------- POSTURE ASSETS -------------------------
import neutralLight from '../../assets/light-mode/NEUTRAL_POSTURE.jpg'
import forwardHeadLight from '../../assets/light-mode/FORWARD_HEAD.jpg'
import chairSlouchingLight from '../../assets/light-mode/CHAIR_SLOUCHING.jpg'
import upperBackHunchLight from '../../assets/light-mode/UPPER_BACK_HUNCH.jpg'
import forwardBodyBendLight from '../../assets/light-mode/FORWARD_BODY_BEND.jpg'
import leaningBackLight from '../../assets/light-mode/LEANING_BACK.jpg'
import lateralLeanLight from '../../assets/light-mode/LATERAL_LEAN.jpg'
import asymmetricalSlouchLight from '../../assets/light-mode/ASSYMETRICAL_SLOUCH.jpg'
import neutralDark from '../../assets/dark-mode/NEUTRAL_POSTURE.jpg'
import forwardHeadDark from '../../assets/dark-mode/FORWARD_HEAD.jpg'
import chairSlouchingDark from '../../assets/dark-mode/CHAIR_SLOUCHING.jpg'
import upperBackHunchDark from '../../assets/dark-mode/UPPER_BACK_HUNCH.jpg'
import forwardBodyBendDark from '../../assets/dark-mode/FORWARD_BODY_BEND.jpg'
import leaningBackDark from '../../assets/dark-mode/LEANING_BACK.jpg'
import lateralLeanDark from '../../assets/dark-mode/LATERAL_LEAN.jpg'
import asymmetricalSlouchDark from '../../assets/dark-mode/ASSYMETRICAL_SLOUCH.jpg'

// Centralized mapping shared by live posture and the reference Almanac.
export const postureImageMap = {
  POSTURE_NEUTRAL_GOOD: { light: neutralLight, dark: neutralDark },
  POSTURE_FORWARD_HEAD_TEXT_NECK: { light: forwardHeadLight, dark: forwardHeadDark },
  POSTURE_CHAIR_SLOUCHING: { light: chairSlouchingLight, dark: chairSlouchingDark },
  POSTURE_KYPHOSIS_UPPER_HUNCH: { light: upperBackHunchLight, dark: upperBackHunchDark },
  POSTURE_FORWARD_BODY_BEND: { light: forwardBodyBendLight, dark: forwardBodyBendDark },
  POSTURE_RECLINED_LEANING_BACK: { light: leaningBackLight, dark: leaningBackDark },
  POSTURE_LATERAL_LEAN_SCOLIOTIC: { light: lateralLeanLight, dark: lateralLeanDark },
  POSTURE_ASYMMETRIC_SLOUCH: { light: asymmetricalSlouchLight, dark: asymmetricalSlouchDark },
}

// Translate the detector's labels to the stable Almanac posture IDs.
export function getPostureImagesForClassification(classification) {
  if (!classification) return postureImageMap.POSTURE_NEUTRAL_GOOD
  const label = classification.label || ''
  if (classification.tone === 'good' || label === 'Good Posture') return postureImageMap.POSTURE_NEUTRAL_GOOD
  if (label.includes('Forward Head')) return postureImageMap.POSTURE_FORWARD_HEAD_TEXT_NECK
  if (label.includes('Slouched Lumbar')) return postureImageMap.POSTURE_CHAIR_SLOUCHING
  if (label.includes('Backward Head')) return postureImageMap.POSTURE_RECLINED_LEANING_BACK
  if (label.includes('Leaning')) return postureImageMap.POSTURE_LATERAL_LEAN_SCOLIOTIC
  return postureImageMap.POSTURE_KYPHOSIS_UPPER_HUNCH
}

// ------------------------- APPLICATION DATA -------------------------
export const ispaData = {
  device: { id: 'ESP32', connected: false, bluetooth: 'Waiting for telemetry' },
  telemetry: [], biometricStream: [], alerts: [],
  postureAlmanac: [
    { name: 'Neutral / Good Posture', logic: 'POSTURE_NEUTRAL_GOOD', description: 'Balanced alignment.', imageName: 'NEUTRAL_POSTURE.jpg', images: postureImageMap.POSTURE_NEUTRAL_GOOD, tone: 'good' },
    { name: 'Forward Head / Text Neck', logic: 'POSTURE_FORWARD_HEAD_TEXT_NECK', description: 'Head shifts forward.', imageName: 'FORWARD_HEAD.jpg', images: postureImageMap.POSTURE_FORWARD_HEAD_TEXT_NECK, tone: 'aware' },
    { name: 'Chair Slouching', logic: 'POSTURE_CHAIR_SLOUCHING', description: 'Torso collapses toward the chair back.', imageName: 'CHAIR_SLOUCHING.jpg', images: postureImageMap.POSTURE_CHAIR_SLOUCHING, tone: 'bad' },
    { name: 'Upper Back Hunch', logic: 'POSTURE_KYPHOSIS_UPPER_HUNCH', description: 'Thoracic spine rounds.', imageName: 'UPPER_BACK_HUNCH.jpg', images: postureImageMap.POSTURE_KYPHOSIS_UPPER_HUNCH, tone: 'poor' },
    { name: 'Forward Body Bend', logic: 'POSTURE_FORWARD_BODY_BEND', description: 'Torso leans toward the desk.', imageName: 'FORWARD_BODY_BEND.jpg', images: postureImageMap.POSTURE_FORWARD_BODY_BEND, tone: 'poor' },
    { name: 'Reclined / Leaning Back', logic: 'POSTURE_RECLINED_LEANING_BACK', description: 'Torso leans behind the hips.', imageName: 'LEANING_BACK.jpg', images: postureImageMap.POSTURE_RECLINED_LEANING_BACK, tone: 'aware' },
    { name: 'Lateral Lean', logic: 'POSTURE_LATERAL_LEAN_SCOLIOTIC', description: 'Shoulders or hips drift sideways.', imageName: 'LATERAL_LEAN.jpg', images: postureImageMap.POSTURE_LATERAL_LEAN_SCOLIOTIC, tone: 'aware' },
    { name: 'Asymmetric Slouch', logic: 'POSTURE_ASYMMETRIC_SLOUCH', description: 'One side drops noticeably lower.', imageName: 'ASSYMETRICAL_SLOUCH.jpg', images: postureImageMap.POSTURE_ASYMMETRIC_SLOUCH, tone: 'bad' },
  ],
}

import neutralPosture from '../../assets/postures/neutral_posture.jpg'
import forwardHead from '../../assets/postures/forward_head.jpg'
import chairSlouching from '../../assets/postures/chair_slouching.jpg'
import upperBackHunch from '../../assets/postures/upper_back_hunch.jpg'
import forwardBodyBend from '../../assets/postures/forward_body_bend.jpg'
import leaningBack from '../../assets/postures/leaning_back.jpg'
import lateralLean from '../../assets/postures/lateral_lean.jpg'
import asymmetricalSlouch from '../../assets/postures/asymmetrical_slouch.jpg'

export const ispaData = {
  user: { name: '', email: '' },
  device: { id: 'ESP32', connected: false, bluetooth: 'Waiting for telemetry' },
  telemetry: [], biometricStream: [], alerts: [],
  postureAlmanac: [
    { name: 'Neutral / Good Posture', logic: 'POSTURE_NEUTRAL_GOOD', description: 'Balanced alignment.', imageName: 'neutral_posture.jpg', image: neutralPosture, tone: 'good' },
    { name: 'Forward Head / Text Neck', logic: 'POSTURE_FORWARD_HEAD_TEXT_NECK', description: 'Head shifts forward.', imageName: 'forward_head.jpg', image: forwardHead, tone: 'aware' },
    { name: 'Chair Slouching', logic: 'POSTURE_CHAIR_SLOUCHING', description: 'Torso collapses toward the chair back.', imageName: 'chair_slouching.jpg', image: chairSlouching, tone: 'bad' },
    { name: 'Upper Back Hunch', logic: 'POSTURE_KYPHOSIS_UPPER_HUNCH', description: 'Thoracic spine rounds.', imageName: 'upper_back_hunch.jpg', image: upperBackHunch, tone: 'poor' },
    { name: 'Forward Body Bend', logic: 'POSTURE_FORWARD_BODY_BEND', description: 'Torso leans toward the desk.', imageName: 'forward_body_bend.jpg', image: forwardBodyBend, tone: 'poor' },
    { name: 'Reclined / Leaning Back', logic: 'POSTURE_RECLINED_LEANING_BACK', description: 'Torso leans behind the hips.', imageName: 'leaning_back.jpg', image: leaningBack, tone: 'aware' },
    { name: 'Lateral Lean', logic: 'POSTURE_LATERAL_LEAN_SCOLIOTIC', description: 'Shoulders or hips drift sideways.', imageName: 'lateral_lean.jpg', image: lateralLean, tone: 'aware' },
    { name: 'Asymmetric Slouch', logic: 'POSTURE_ASYMMETRIC_SLOUCH', description: 'One side drops noticeably lower.', imageName: 'asymmetrical_slouch.jpg', image: asymmetricalSlouch, tone: 'bad' },
  ],
}

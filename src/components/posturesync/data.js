import neutralPosture from '../../assets/postures/neutral_posture.jpg'
import forwardHead from '../../assets/postures/forward_head.jpg'
import chairSlouching from '../../assets/postures/chair_slouching.jpg'
import upperBackHunch from '../../assets/postures/upper_back_hunch.jpg'
import forwardBodyBend from '../../assets/postures/forward_body_bend.jpg'
import leaningBack from '../../assets/postures/leaning_back.jpg'
import lateralLean from '../../assets/postures/lateral_lean.jpg'
import asymmetricalSlouch from '../../assets/postures/asymmetrical_slouch.jpg'

export const postureGuardMockData = {
  user: { name: 'Alex Morgan', email: 'alex@postureguard.app' },
  postureAlmanac: [
    { name: 'Neutral / Good Posture', logic: 'isGoodPosture()', description: 'Head, shoulders, and hips stay stacked with a relaxed natural curve.', imageName: 'neutral_posture.jpg', image: neutralPosture, tone: 'good' },
    { name: 'Forward Head / Text Neck', logic: 'isTextNeck()', description: 'The head shifts forward while looking down at a screen for too long.', imageName: 'forward_head.jpg', image: forwardHead, tone: 'aware' },
    { name: 'Chair Slouching', logic: 'isChairSlouch()', description: 'The pelvis slides forward and the torso collapses toward the chair back.', imageName: 'chair_slouching.jpg', image: chairSlouching, tone: 'bad' },
    { name: 'Upper Back Hunch', logic: 'isUpperBackHunch()', description: 'The thoracic spine rounds and shoulders roll toward the chest.', imageName: 'upper_back_hunch.jpg', image: upperBackHunch, tone: 'poor' },
    { name: 'Forward Body Bend', logic: 'isForwardBend()', description: 'The whole torso leans toward the desk instead of hinging from the hips.', imageName: 'forward_body_bend.jpg', image: forwardBodyBend, tone: 'poor' },
    { name: 'Reclined / Leaning Back', logic: 'isReclinedPosture()', description: 'The torso moves behind the hips and creates a deep reclined angle.', imageName: 'leaning_back.jpg', image: leaningBack, tone: 'aware' },
    { name: 'Lateral Lean', logic: 'isLateralLean()', description: 'The shoulders or hips drift to one side instead of staying centered.', imageName: 'lateral_lean.jpg', image: lateralLean, tone: 'aware' },
    { name: 'Asymmetric Slouch', logic: 'isAsymmetricSlouch()', description: 'One shoulder or side of the body drops noticeably lower than the other.', imageName: 'asymmetrical_slouch.jpg', image: asymmetricalSlouch, tone: 'bad' },
  ],
  device: { id: 'PS-ESP32-042', connected: true, battery: 84, signal: 92, bluetooth: 'Connected' },
  today: { score: 86, yesterdayChange: 8, confidence: 94, goodTime: '68%', slouchTime: '18m', corrections: 12, longestStreak: '47m' },
  telemetry: [
    { label: 'Neck Angle', value: '8°', range: '0°–12° optimal', status: 'good' },
    { label: 'Upper Back', value: '14°', range: '0°–18° optimal', status: 'good' },
    { label: 'Lower Back', value: '21°', range: '10°–25° optimal', status: 'aware' },
    { label: 'Sitting Time', value: '3h 42m', range: 'Break recommended', status: 'aware' },
  ],
  weeklyScores: [
    { day: 'Mon', score: 74 }, { day: 'Tue', score: 81 }, { day: 'Wed', score: 79 },
    { day: 'Thu', score: 88 }, { day: 'Fri', score: 84 }, { day: 'Sat', score: 91 }, { day: 'Sun', score: 86 },
  ],
  timeline: [
    { time: '00:00', score: 62, category: 'bad' }, { time: '02:00', score: 78, category: 'aware' },
    { time: '04:00', score: 86, category: 'good' }, { time: '06:00', score: 90, category: 'good' },
    { time: '08:00', score: 72, category: 'poor' }, { time: '10:00', score: 88, category: 'good' },
    { time: '12:00', score: 76, category: 'aware' }, { time: '14:00', score: 86, category: 'good' },
  ],
  alerts: [
    { id: 1, type: 'Slight forward head posture', description: 'Neck angle exceeded the optimal range.', time: '10:42 AM', severity: 'aware' },
    { id: 2, type: 'Shoulders tilted', description: 'Upper-back alignment needed adjustment.', time: '9:18 AM', severity: 'poor' },
    { id: 3, type: 'Prolonged slouching', description: 'Posture was below threshold for 5 minutes.', time: '8:46 AM', severity: 'bad' },
  ],
  gestures: [
    { gesture: 'Head Tilt Left', action: 'Previous', icon: 'history' }, { gesture: 'Head Tilt Right', action: 'Next', icon: 'chart' },
    { gesture: 'Head Nod', action: 'Select / Click', icon: 'check' }, { gesture: 'Lean Forward', action: 'Scroll Down', icon: 'monitor' },
    { gesture: 'Lean Backward', action: 'Scroll Up', icon: 'live' },
  ],
  biometricStream: [
    { time: '10:00', neck: 8, back: 14 }, { time: '10:05', neck: 10, back: 16 }, { time: '10:10', neck: 7, back: 13 },
    { time: '10:15', neck: 12, back: 18 }, { time: '10:20', neck: 9, back: 15 }, { time: '10:25', neck: 8, back: 14 },
  ],
  analytics: {
    duration: [{ hour: '9 AM', good: 38, poor: 12 }, { hour: '10 AM', good: 52, poor: 8 }, { hour: '11 AM', good: 46, poor: 14 }, { hour: '12 PM', good: 31, poor: 29 }, { hour: '1 PM', good: 42, poor: 18 }, { hour: '2 PM', good: 48, poor: 12 }, { hour: '3 PM', good: 36, poor: 24 }, { hour: '4 PM', good: 44, poor: 16 }, { hour: '5 PM', good: 28, poor: 32 }],
    movement: '4.8°/hr', corrections: 12,
    insights: ['Your posture is strongest between 10 AM–12 PM.', 'You tend to slouch after 45 minutes of continuous sitting.', 'Your average correction time improved by 18% this week.'],
  },
}

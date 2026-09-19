const fs = require('fs')
const https = require('https')
const path = require('path')
const dotenv = require('dotenv')
const { POSTURE_PLAN_SYSTEM_PROMPT } = require('./posture-system-prompt')

const envCandidates = [
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(path.dirname(process.execPath), '.env'),
]

function loadEnvironment() {
  for (const candidate of [...new Set(envCandidates)]) {
    if (fs.existsSync(candidate)) dotenv.config({ path: candidate, override: true })
  }
}

function getGeminiApiKey() {
  loadEnvironment()
  return process.env.GEMINI_API_KEY?.trim() || ''
}

function addDays(startDate, offset) {
  const date = new Date(`${startDate}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return new Date(Date.now() + offset * 86400000)
  date.setUTCDate(date.getUTCDate() + offset)
  return date
}

function routineLength(angle) {
  return Math.max(3, Math.min(30, Math.ceil(Math.abs(Number(angle)) * 1.5)))
}

function fallbackCalendar(angle, startDate) {
  const days = routineLength(angle)
  const dailyCorrection = Math.max(0.1, Number((angle / days).toFixed(2)))
  return Array.from({ length: days }, (_, index) => {
    const targetAngle = Math.max(0, Number((angle - dailyCorrection * (index + 1)).toFixed(2)))
    return {
      day: index + 1,
      date: addDays(startDate, index).toISOString().slice(0, 10),
      angleToRectify: Number((angle - targetAngle).toFixed(2)),
      targetAngle,
      postureTips: ['Keep your head stacked over your shoulders.', 'Reset gently during sitting, standing, and walking.'],
      avoid: ['Avoid holding one fixed position for long periods.'],
      discipline: 'Take a brief posture reset and check your alignment before continuing.',
    }
  })
}

function generatePosturePlan(angle, category, startDate = new Date().toISOString().slice(0, 10)) {
  const apiKey = getGeminiApiKey()
  const numericAngle = Number(angle)
  const severity = numericAngle <= 10 ? 'minimal' : numericAngle <= 20 ? 'mild' : numericAngle <= 35 ? 'moderate' : 'severe'
  if (!apiKey) return Promise.reject(new Error('Gemini plan generation requires an API key — check your .env file.'))

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: POSTURE_PLAN_SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: `Measured neck-to-hip deviation angle from the pose landmark model: ${numericAngle} degrees. Detected posture category: ${category}. Severity: ${severity}. Build the shortest realistic routine of no more than 30 days and start it on ${startDate}.` }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192, responseMimeType: 'application/json' },
  })

  return new Promise((resolve, reject) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey)}`
    const request = https.request(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(requestBody) } }, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { body += chunk })
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) return reject(new Error(`AI plan request failed (${response.statusCode}).`))
        try {
          const responseBody = JSON.parse(body)
          const text = responseBody.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || ''
          const jsonStart = text.indexOf('{')
          const jsonEnd = text.lastIndexOf('}')
          if (jsonStart < 0 || jsonEnd <= jsonStart) throw new Error('AI returned no JSON payload.')
          const payload = JSON.parse(text.slice(jsonStart, jsonEnd + 1))
          const calendar = Array.isArray(payload.calendar) ? payload.calendar.map((day) => ({
            day: Number(day?.day),
            date: String(day?.date || ''),
            angleToRectify: Number(day?.angleToRectify),
            targetAngle: Number(day?.targetAngle),
            postureTips: Array.isArray(day?.postureTips) ? day.postureTips.map(String).filter(Boolean) : [],
            avoid: Array.isArray(day?.avoid) ? day.avoid.map(String).filter(Boolean) : [],
            discipline: String(day?.discipline || '').trim(),
          })) : []
          const validCalendar = calendar.length >= 1 && calendar.length <= 30 && calendar.every((day, index) => (
            day.day === index + 1 && /^\d{4}-\d{2}-\d{2}$/.test(day.date) && Number.isFinite(day.angleToRectify) && Number.isFinite(day.targetAngle) && day.postureTips.length > 0 && day.avoid.length > 0 && day.discipline
          ))
          if (!Number.isFinite(Number(payload.measuredAngle)) || Number(payload.measuredAngle) !== numericAngle || !validCalendar) {
            return resolve({ measuredAngle: numericAngle, calendar: fallbackCalendar(numericAngle, startDate) })
          }
          resolve({ measuredAngle: numericAngle, calendar })
        } catch {
          resolve({ measuredAngle: numericAngle, calendar: fallbackCalendar(numericAngle, startDate) })
        }
      })
    })
    request.on('error', () => reject(new Error('Unable to reach the AI plan service. Check your connection and try again.')))
    request.write(requestBody)
    request.end()
  })
}

module.exports = { generatePosturePlan, getGeminiApiKey }

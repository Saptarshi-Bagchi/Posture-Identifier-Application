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

function generatePosturePlan(angle, category) {
  const apiKey = getGeminiApiKey()
  const numericAngle = Number(angle)
  const severity = numericAngle <= 10 ? 'minimal' : numericAngle <= 20 ? 'mild' : numericAngle <= 35 ? 'moderate' : 'severe'
  if (!apiKey) return Promise.reject(new Error('Gemini plan generation requires an API key — check your .env file.'))

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: POSTURE_PLAN_SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: `Measured shoulder-to-hip deviation: ${numericAngle} degrees. Detected posture category: ${category}. Severity: ${severity}.` }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 900, responseMimeType: 'application/json' },
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
          const text = responseBody.candidates?.[0]?.content?.parts?.[0]?.text || ''
          const jsonText = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
          const days = JSON.parse(jsonText).days
          if (!Array.isArray(days) || days.length !== 7 || days.some((day, index) => (
            day.day !== index + 1 || !day.focus || !day.postureCorrection || !day.targetAngle || !day.angleGuidance || !day.expectation
          ))) throw new Error('AI returned an incomplete plan.')
          resolve(days)
        } catch (_) { reject(new Error('AI returned an unreadable improvement plan.')) }
      })
    })
    request.on('error', () => reject(new Error('Unable to reach the AI plan service. Check your connection and try again.')))
    request.write(requestBody)
    request.end()
  })
}

module.exports = { generatePosturePlan, getGeminiApiKey }

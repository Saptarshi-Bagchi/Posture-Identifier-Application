const { generatePosturePlan } = require('../backend/gemini-plan')

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {})
    const plan = await generatePosturePlan(body.angle, body.category, body.startDate)
    return response.status(200).json(plan)
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : 'Unable to generate the improvement plan.' })
  }
}

const fs = require('fs')
const http = require('http')
const path = require('path')
const { generatePosturePlan } = require('./backend/gemini-plan')

const port = Number(process.env.PORT || 8787)
const distPath = path.join(__dirname, 'dist')

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' })
  response.end(JSON.stringify(body))
}

const server = http.createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' })
    return response.end()
  }
  if (request.method === 'POST' && request.url === '/api/posture-plan') {
    let raw = ''
    request.on('data', (chunk) => { raw += chunk; if (raw.length > 10000) request.destroy() })
    request.on('end', async () => {
      try {
        const body = JSON.parse(raw)
        const days = await generatePosturePlan(body.angle, body.category)
        sendJson(response, 200, { days })
      } catch (error) {
        sendJson(response, 500, { error: error instanceof Error ? error.message : 'Unable to generate the improvement plan.' })
      }
    })
    return
  }
  const requestedPath = request.url === '/' ? '/index.html' : request.url
  const filePath = path.resolve(distPath, `.${requestedPath}`)
  if (!filePath.startsWith(path.resolve(distPath))) return sendJson(response, 403, { error: 'Forbidden' })
  fs.readFile(filePath, (error, data) => {
    if (error) return sendJson(response, 404, { error: 'Not found' })
    response.writeHead(200)
    response.end(data)
  })
})

server.listen(port, () => console.log(`I-SPA server listening on http://localhost:${port}`))

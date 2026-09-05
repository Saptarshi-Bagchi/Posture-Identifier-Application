// ------------------------- IMPORTS -------------------------
const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')
const { generatePosturePlan } = require('./backend/gemini-plan')

function posturePlanApi() {
  return {
    name: 'posture-plan-api',
    configureServer(server) {
      server.middlewares.use('/api/posture-plan', (request, response, next) => {
        if (request.method !== 'POST') return next()
        let raw = ''
        request.on('data', (chunk) => { raw += chunk })
        request.on('end', async () => {
          try {
            const body = JSON.parse(raw)
            const days = await generatePosturePlan(body.angle, body.category)
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ days }))
          } catch (error) {
            response.statusCode = 500
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to generate the improvement plan.' }))
          }
        })
      })
    },
  }
}

// ------------------------- VITE CONFIGURATION -------------------------
module.exports = defineConfig({
  root: 'src',
  base: './',
  plugins: [react(), posturePlanApi()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        entryFileNames: 'js/ispa.js',
        chunkFileNames: 'js/chunks/[name].js',
        assetFileNames: (assetInfo) => {
          const assetName = assetInfo.name || ''
          if (assetName.endsWith('.css')) return 'css/ispa.css'
          return 'assets/[name][extname]'
        },
      },
    },
  },
})

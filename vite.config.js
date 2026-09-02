// ------------------------- IMPORTS -------------------------
const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')

// ------------------------- VITE CONFIGURATION -------------------------
module.exports = defineConfig({
  root: 'src',
  base: './',
  plugins: [react()],
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
        entryFileNames: 'ispa.js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          const assetName = assetInfo.name || ''
          if (assetName.endsWith('.css')) return 'ispa.css'
          if (assetName.includes('ispa-logo')) return 'assets/ispa-logo[extname]'
          return 'assets/[name][extname]'
        },
      },
    },
  },
})

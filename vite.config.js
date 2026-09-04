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

const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')

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
        entryFileNames: 'postureguard.js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          const assetName = assetInfo.name || ''
          if (assetName.endsWith('.css')) return 'postureguard.css'
          if (assetName.includes('postureguard-logo')) return 'assets/postureguard-logo[extname]'
          return 'assets/[name][extname]'
        },
      },
    },
  },
})

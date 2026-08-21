module.exports = {
  content: ['./src/index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#171B12',
          surface: '#24291A',
          panel: '#303622',
          border: '#596143',
          cyan: '#B9AE62',
          indigo: '#55718C',
          green: '#8FA36B',
          yellow: '#C6A34F',
          olive: '#707B45',
          blue: '#55718C',
        },
        'status-good': '#22C55E',
        'status-warn': '#F59E0B',
        'status-bad': '#EF4444',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #707B45 0%, #C6A34F 55%, #8FA36B 100%)',
      },
    },
  },
  plugins: [],
}

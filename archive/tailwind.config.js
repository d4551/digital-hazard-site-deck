module.exports = {
  content: ['./*.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        primary: '#ff8c00',
        secondary: '#ff4500',
        accent: '#ffa500',
        dark: '#000000',
        darker: '#0a0a0a',
        success: '#00ff88',
        warning: '#ffaa00',
        info: '#00d4ff',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['dark', 'cyberpunk'],
  },
  darkMode: 'class',
}

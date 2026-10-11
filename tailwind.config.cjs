module.exports = {
  content: ['./index.html', './*.tsx', './components/**/*.tsx', './pages/**/*.tsx'],
  theme: { extend: {
    colors: { gold: '#E6C15A', navy: '#05070a', mutedGray: '#8C9197', dimGray: '#555555' },
    fontFamily: { sans: ['Outfit', 'sans-serif'], arabic: ['Almarai', 'sans-serif'] },
  } },
  plugins: [],
};

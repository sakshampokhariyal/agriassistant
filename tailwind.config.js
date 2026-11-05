/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#eef6f0',
          100: '#d6eadb',
          200: '#afd4ba',
          300: '#7fb893',
          400: '#4d9a6b',
          500: '#2f7d52',
          600: '#1f6541',
          700: '#17512f',
          800: '#0f3f25',
          900: '#0a2e1a',
        },
        moss: { 100: '#e8ecd5', 200: '#d1d9ab', 400: '#9aab5a', 600: '#6b7d33' },
        cream: { 50: '#fbfbf9', 100: '#f4f4f1', 200: '#ebebe6', 300: '#e2e2db' },
        earth: { 100: '#f6e7d0', 400: '#d9a24f', 500: '#c98a2b', 600: '#a96d1b', 700: '#8a4f2a' },
        clay: { 100: '#fbe3da', 500: '#c4573a', 600: '#a8452c' },
        sky: { 100: '#dff0f5', 500: '#3d8fa8' },
      },
      fontFamily: {
        sans: ['Inter','"Noto Sans Devanagari"', '"Noto Sans Kannada"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,81,47,0.06), 0 4px 14px rgba(23,81,47,0.06)',
        lift: '0 6px 24px rgba(23,81,47,0.14)',
      },
      borderRadius: { '2xl': '1.125rem', '3xl': '1.5rem' },
    },
  },
  plugins: [],
};

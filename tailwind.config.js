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
        // Navy scale built from the logo navy (#1b2a5e) – used for water / information accents.
        navy: {
          50: '#eef1f8',
          100: '#dde3f1',
          200: '#bcc6e2',
          300: '#94a3cf',
          400: '#6377b3',
          500: '#3e5296',
          600: '#2c3f7d',
          700: '#1b2a5e',
          800: '#16234f',
          900: '#121c40',
          950: '#0b1229',
        },
        // Official AgriSahaya logo palette (sampled from public/logo.png); also exposed as CSS vars in index.css.
        brand: {
          green: '#1b7a32', // "AGRI" wordmark
          leaf: '#58a73c', // sprout
          gold: '#e9a84f', // sun disc
          'gold-light': '#f8c068',
          navy: '#1b2a5e', // hands + "SAHAYA"
          'navy-dark': '#121c40', // tagline
          cream: '#f9f7ea', // logo background
        },
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

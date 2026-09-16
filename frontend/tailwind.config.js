/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ios: {
          bg: 'var(--bg)',
          card: 'var(--card)',
          input: 'var(--input)',
          hover: 'var(--hover)',
          border: 'var(--border)',
          blue: '#0a84ff',
          green: '#32d74b',
          red: '#ff453a',
          text: {
            main: 'var(--text-main)',
            sec: 'var(--text-sec)',
            muted: 'var(--text-muted)'
          }
        }
      }
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ios: {
          bg: '#000000',
          card: '#1c1c1e',
          input: '#2c2c2e',
          hover: '#3a3a3c',
          border: '#38383a',
          blue: '#0a84ff',
          green: '#32d74b',
          red: '#ff453a',
          text: {
            main: '#ffffff',
            sec: '#8e8e93',
            muted: '#aeaeb2'
          }
        }
      }
    },
  },
  plugins: [],
};
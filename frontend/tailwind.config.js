export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060b14',
          900: '#0a1020',
          800: '#0d1829',
          700: '#111f35',
          600: '#162640',
        },
        cyan: {
          DEFAULT: '#00c8ff',
          dim: 'rgba(0,200,255,0.6)',
          faint: 'rgba(0,200,255,0.12)',
          glow: 'rgba(0,200,255,0.18)',
        },
        blue: {
          accent: '#0066ff',
          mid: '#0096ff',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          md: 'rgba(255,255,255,0.07)',
          border: 'rgba(0,200,255,0.12)',
          borderhover: 'rgba(0,200,255,0.28)',
        },
        online: '#22d46a',
      },
      backgroundImage: {
        'msg-me': 'linear-gradient(135deg, rgba(0,150,255,0.35), rgba(0,200,255,0.25))',
        'avatar': 'linear-gradient(135deg, #0066ff, #00c8ff)',
        'send-btn': 'linear-gradient(135deg, #0096ff, #00c8ff)',
        'story-ring': 'linear-gradient(135deg, #00c8ff, #0066ff)',
      },
      backdropBlur: {
        glass: '20px',
      },
    },
  },
  plugins: [],
};
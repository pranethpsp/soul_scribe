/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        soul: {
          bg: '#0D1117',
          surface: '#161B22',
          border: '#30363D',
          gold: '#D4A853',
          'gold-dim': '#9A7A3A',
          ivory: '#F5F0E8',
          'ivory-dim': '#A0978A',
          accent: '#7C6A3F',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bar-fill': 'barFill 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        barFill: { from: { width: '0%' }, to: { width: 'var(--bar-width)' } },
      },
    },
  },
  plugins: [],
}

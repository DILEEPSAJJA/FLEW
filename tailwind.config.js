/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        flew: {
          dark: '#0a0a0c',
          card: '#121216',
          border: '#22222a',
          red: '#ff2626',
          redGlow: 'rgba(255, 38, 38, 0.35)',
          redDark: '#c71b1b',
          pink: '#ffd1dc',
          cream: '#fff5ea',
          choco: '#2a160d',
          chocoLight: '#4e2a1a',
          muted: '#8e8e99',
        }
      },
      fontFamily: {
        display: ['"Cabinet Grotesk"', '"Syne"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2.5s infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(255, 38, 38, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 38, 38, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}

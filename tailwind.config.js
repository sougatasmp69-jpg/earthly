/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        earthly: {
          50: '#f2f9f5',
          100: '#e1f2e8',
          200: '#c5e4d2',
          300: '#99cfb3',
          400: '#64b28d',
          500: '#3e956e',
          600: '#2e7856',
          700: '#266046',
          800: '#214d3a',
          900: '#1d4031',
          950: '#0d231b',
        },
        clay: {
          500: '#f97316',
          600: '#ea580c',
        },
        sage: {
          100: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        amberGold: {
          500: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(46, 120, 86, 0.15)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 16px 32px -4px rgba(38, 96, 70, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}

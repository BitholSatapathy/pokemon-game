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
        background: '#0B0B12',
        surface: {
          DEFAULT: '#131322',
          light: '#1A1A2E',
          card: '#161628',
          border: '#2A2A44',
        },
        brand: {
          purple: '#8B5CF6',
          violet: '#7C3AED',
          indigo: '#6366F1',
          gold: '#F59E0B',
          amber: '#D97706',
        },
        rarity: {
          common: '#94A3B8',
          uncommon: '#10B981',
          rare: '#3B82F6',
          ultrarare: '#A855F7',
          secret: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.5)',
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.5)',
        'glow-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-holo': '0 0 35px rgba(168, 85, 247, 0.4), 0 0 15px rgba(59, 130, 246, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
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

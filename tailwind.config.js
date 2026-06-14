/** @type {import('tailwindcss').Config} */

// Motive brand palette — "Motive Violet" (momentum) + "Spark" amber (energy).
const violet = {
  50: '#F4F1FF',
  100: '#EBE5FF',
  200: '#D9CEFF',
  300: '#BFA9FF',
  400: '#A07DFB',
  500: '#7C5CF6',
  600: '#6B46E8',
  700: '#5A37C9',
  800: '#4A2EA3',
  900: '#3D2982',
  950: '#251752',
};

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand tokens
        brand: violet,
        // Remap `indigo` to the brand violet so existing components rebrand automatically
        indigo: violet,
        spark: {
          50: '#FFF8EB',
          100: '#FFEFCC',
          200: '#FFDD99',
          300: '#FFC966',
          400: '#FFC04D',
          500: '#F5A524',
          600: '#DB8A0E',
          700: '#B66A08',
          800: '#92520C',
          900: '#78440F',
        },
        dark: {
          background: '#0E0D12',
          surface: '#17151D',
          raised: '#211E29',
          border: '#2A2733',
          text: '#E9E7EF',
          muted: '#9C99A8',
        },
      },
      fontFamily: {
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7C5CF6 0%, #9B5CFF 55%, #C45BD6 100%)',
        'brand-soft': 'linear-gradient(135deg, rgba(124,92,246,0.12) 0%, rgba(196,91,214,0.12) 100%)',
      },
      boxShadow: {
        brand: '0 8px 24px -6px rgba(124, 92, 246, 0.45)',
        'brand-sm': '0 2px 10px -2px rgba(124, 92, 246, 0.35)',
      },
      animation: {
        'spin-slow': 'spin 4s linear infinite',
        'spark-pulse': 'sparkPulse 2.4s ease-in-out infinite',
      },
      keyframes: {
        sparkPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.65', transform: 'scale(0.82)' },
        },
      },
    },
  },
  plugins: [],
};

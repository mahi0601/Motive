/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', 
    content: [
      './index.html',
      './src/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
      extend: {
        animation: {
          'spin-slow': 'spin 4s linear infinite',
        },
        colors: {
          dark: {
            background: '#1f1f1f',
            surface: '#2a2a2a',
            border: '#3a3a3a',
            text: '#e5e5e5',
            muted: '#9ca3af'
          }
        }
      }
    },
    plugins: [],
  };

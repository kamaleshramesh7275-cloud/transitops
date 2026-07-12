/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',      // slate-900
          card: '#1e293b',      // slate-800
          border: '#334155',    // slate-700
          text: '#f8fafc',      // slate-50
          muted: '#94a3b8',     // slate-400
          primary: '#10b981',   // emerald-500
          primaryHover: '#059669', // emerald-600
          secondary: '#06b6d4', // cyan-500
          secondaryHover: '#0891b2', // cyan-600
          accent: '#6366f1',    // indigo-500
          danger: '#ef4444',    // red-500
          dangerHover: '#dc2626', // red-600
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}

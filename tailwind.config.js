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
          dark: '#0a0a0a',      // almost black
          card: '#121212',      // dark gray surface
          border: '#27272a',    // zinc-800
          text: '#f4f4f5',      // zinc-100
          muted: '#a1a1aa',     // zinc-400
          primary: '#bef264',   // neon lime
          primaryHover: '#a3e635', // neon lime hover
          secondary: '#71717a', // zinc-500
          secondaryHover: '#52525b', // zinc-600
          accent: '#a3e635',    // neon lime accent
          danger: '#f87171',    // red-400
          dangerHover: '#ef4444', // red-500
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

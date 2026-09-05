/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        sans: ['"Space Mono"', 'sans-serif'], // Forcing HUD to be entirely monospace
      },
      colors: {
        cyan: {
          400: '#00F0FF', // Cyberpunk neon cyan
          500: '#00d6e6',
          900: 'rgba(0, 240, 255, 0.1)',
        },
        magenta: {
          400: '#FF0055', // Cyberpunk neon magenta
          500: '#e6004c',
          900: 'rgba(255, 0, 85, 0.1)',
        }
      }
    },
  },
  plugins: [],
}

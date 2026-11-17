/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0f12',
        surface: '#15181e',
        'surface-elevated': '#1d2129',
        border: '#2a303c',
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
        accent: '#ec4899',
      },
    },
  },
  plugins: [],
}

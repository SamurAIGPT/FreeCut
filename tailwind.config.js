/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic neutral dark and light tokens (no blue saturation)
        app: {
          bg: 'var(--app-bg)',
          surface: 'var(--app-surface)',
          elevated: 'var(--app-elevated)',
          border: 'var(--app-border)',
          muted: 'var(--app-muted)',
          text: 'var(--app-text)',
          'text-muted': 'var(--app-text-muted)',
        },
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
      },
    },
  },
  plugins: [],
}

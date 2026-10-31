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
          sidebar: '#0F172A',
          canvas: '#F8FAFC',
          primary: '#4F46E5',
          'primary-hover': '#4338CA',
          border: '#E2E8F0',
          muted: '#64748B',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
}


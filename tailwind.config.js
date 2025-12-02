/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        medieval: ['MedievalSharp', 'cursive'],
        pixel: ['VT323', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 1s ease-out forwards',
        'crawl': 'crawl 65s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
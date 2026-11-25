/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          50: '#f0f5ff',
          100: '#e0edfe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#0f3b7d', // Màu xanh chính quyền
          800: '#0c2d61',
          900: '#081f42',
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1a365d',
          hover: '#152a47',
        },
        'action-orange': '#f6ad55',
        'cfb-slate': '#4a5568',
        'app-bg': '#f7fafc',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'btn': '8px',
      },
    },
  },
  plugins: [],
};

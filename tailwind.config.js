/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Coral accent (default)
        coral: {
          50:  '#FEF5F3',
          100: '#FDEAE6',
          200: '#FAD0C8',
          300: '#F7B5AA',
          400: '#F4A99A',  // brand default
          500: '#EF8C7A',
          600: '#E86E59',
          700: '#D4513C',
          800: '#A83D2E',
          900: '#7C2D20',
        },
        // Pasteles adicionales configurables
        lavender: {
          400: '#C4B5FD',
          500: '#A78BFA',
        },
        blush: {
          400: '#FDA4AF',
          500: '#FB7185',
        },
        mint: {
          400: '#6EE7B7',
          500: '#34D399',
        },
        sky: {
          400: '#7DD3FC',
          500: '#38BDF8',
        },
        peach: {
          400: '#FDBA74',
          500: '#FB923C',
        },
      },
      fontFamily: {
        // SF Pro via system font
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'System',
        ],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    fontFamily: {
      sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    // Deliberately small radii: the design avoids heavily rounded corners.
    borderRadius: {
      none: '0',
      sm: '2px',
      DEFAULT: '4px',
      md: '6px',
      lg: '8px',
      full: '9999px',
    },
    extend: {
      colors: {
        brand: {
          50: '#fef2f3',
          100: '#fde6e8',
          200: '#fbd0d5',
          300: '#f7aab2',
          400: '#f0737f',
          500: '#e1384a',
          600: '#c8102e',
          700: '#a50e26',
          800: '#8a1124',
          900: '#74132a',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.05)',
        pop: '0 8px 24px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};

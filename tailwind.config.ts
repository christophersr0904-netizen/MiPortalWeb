import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          750: '#293548',
          850: '#1e293b',
        },
        cobalt: {
          canvas: '#040711',
          surface: '#0D1526',
          'surface-hover': '#243247',
          border: 'rgba(30, 41, 59, 0.45)',
          card: '#334155',
          brand: '#38bdf8',
          'brand-hover': '#0284c7',
        }
      },
      boxShadow: {
        'cobalt-1': '0 10px 25px -5px rgba(2, 6, 23, 0.8), 0 8px 10px -6px rgba(30, 58, 138, 0.18)',
        'cobalt-hover': '0 14px 28px -4px rgba(2, 6, 23, 0.85), 0 10px 14px -5px rgba(30, 58, 138, 0.28)',
        'cobalt-3': '0 25px 50px -12px rgba(2, 6, 23, 0.9), 0 12px 24px -8px rgba(30, 58, 138, 0.25)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} satisfies Config;

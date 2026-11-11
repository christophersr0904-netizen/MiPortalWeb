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
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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

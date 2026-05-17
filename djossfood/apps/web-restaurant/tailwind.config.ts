import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00AA13',
        orange: '#FF6600',
        yellow: '#FFCC00',
        background: '#F7F7F7',
        foreground: '#111111',
        card: '#FFFFFF',
        muted: '#F7F7F7',
        'muted-foreground': '#666666',
        border: '#E0E0E0',
        destructive: '#E53935',
        sidebar: '#1A1A2E',
        'sidebar-text': '#A0A0B8',
        'sidebar-active': '#2A2A42',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#030712',
          900: '#0b0f19',
          850: '#111827',
          800: '#1e293b',
          750: '#263445',
          700: '#334155',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        agent: {
          planner: '#a855f7',     // Purple
          execution: '#3b82f6',   // Blue
          validation: '#10b981',  // Emerald Green
          recovery: '#f59e0b',    // Amber
          monitoring: '#06b6d4',  // Cyan
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowPulse: {
          '0%': { boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(99, 102, 241, 0.7)' },
        },
      },
    },
  },
  plugins: [],
};

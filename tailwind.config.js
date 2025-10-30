const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        text: "var(--color-text)",
        background: "var(--color-background)",
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        surface: 'var(--color-surface)',
        
        accent: {
          DEFAULT: "var(--color-accent)",
          10: "rgba(245, 158, 11, 0.1)",
          20: "rgba(245, 158, 11, 0.2)",
          30: "rgba(245, 158, 11, 0.3)",
          40: "rgba(245, 158, 11, 0.4)",
          50: "rgba(245, 158, 11, 0.5)",
          60: "rgba(245, 158, 11, 0.6)",
          70: "rgba(245, 158, 11, 0.7)",
          80: "rgba(245, 158, 11, 0.8)",
          90: "rgba(245, 158, 11, 0.9)",
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        // ☀️ Light Mode Colors (Unchanged)
        ':root': {
          '--color-text': '#27272A',
          '--color-background': '#F9F9F9',
          '--color-primary': '#8B5CF6',
          '--color-secondary': '#71717A',
          '--color-accent': '#F59E0B',
          '--color-surface': '#FFFFFF',
          // RGB variants for alpha blending and aurora
          '--primary-rgb': '139 92 246',
          '--accent-rgb': '245 158 11',
          '--surface-rgb': '255 255 255',
          // Glass variables
          '--glass-bg': 'rgba(255, 255, 255, 0.55)',
          '--glass-border': 'rgba(17, 24, 39, 0.12)',
        },
        // 🌙 High-Contrast Dark Mode Colors (UPDATED)
        '.dark': {
          '--color-text': '#F1F1F1',          // Brighter text
          '--color-background': '#0B0B0F',    // Much darker background
          '--color-primary': '#A78BFA',
          '--color-secondary': '#A1A1AA',
          '--color-accent': '#FBBF24',
          '--color-surface': '#18181B',       // Darker surface for better separation
          // RGB variants for alpha blending and aurora
          '--primary-rgb': '167 139 250',
          '--accent-rgb': '251 191 36',
          '--surface-rgb': '24 24 27',
          // Glass variables
          '--glass-bg': 'rgba(24, 24, 27, 0.55)',
          '--glass-border': 'rgba(255, 255, 255, 0.12)',
        },
        // Base styles for body
        'html, body': {
          'background-color': 'var(--color-background)',
          'color': 'var(--color-text)',
        },
      });
    }),
  ],
};
import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      textColor: {
        heading: 'var(--color-heading)',
        body: 'var(--color-text)',
        secondary: 'var(--color-secondary)',
        'light-text': 'var(--color-text)',
        'light-secondary': 'var(--color-secondary)',
        'light-heading': 'var(--color-heading)',
        button: 'var(--color-button)',
        brand: 'var(--color-brand)',
      },
      backgroundColor: {
        dark: 'var(--color-background)',
        surface: 'var(--color-surface)',
      },
      borderColor: {
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
      },
      colors: {
        text: "var(--color-text)",
        background: "var(--color-background)",
        secondary: "var(--color-secondary)",
        surface: 'var(--color-surface)',
        
        lightBlue: 'var(--color-light-blue)',
        darkBlue: 'var(--color-dark-blue)',
        
        // Unified blue palette for primary button and branding
        blue: {
          50: '#E6F2FF',
          100: '#CCE5FF',
          200: '#99CBFF',
          300: '#66B2FF',
          400: '#3399FF',
          500: '#0088FF', // Primary brand color (Get Started button)
          600: '#0066CC',
          700: '#0052A3',
          800: '#003D7A',
          900: '#002952',
        },
        
        // Neutral palette - black, white, and grays
        neutral: {
          black: '#0a0a0a',
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
          500: '#6B7280',
          400: '#8B95B8',
          300: '#D1D5DB',
          200: '#E5E7EB',
          100: '#F3F4F6',
          50: '#F9FAFB',
          white: '#FFFFFF',
        },
        
        // Button color unified across the site
        button: {
          DEFAULT: '#0052A3',
          hover: '#003d7a',
          light: '#0066CC',
        },
        
        accent: {
          DEFAULT: "var(--color-accent)",
          10: "rgba(0, 212, 255, 0.1)",
          20: "rgba(0, 212, 255, 0.2)",
          30: "rgba(0, 212, 255, 0.3)",
          40: "rgba(0, 212, 255, 0.4)",
          50: "rgba(0, 212, 255, 0.5)",
          60: "rgba(0, 212, 255, 0.6)",
          70: "rgba(0, 212, 255, 0.7)",
          80: "rgba(0, 212, 255, 0.8)",
          90: "rgba(0, 212, 255, 0.9)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          light: "#5BA3FF",
          dark: "#0052A3",
          brand: "#0088FF", // Primary brand color
        },
      },
    },
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        // ☀️ Light Mode - Accessible with dark text and light backgrounds
        ':root': {
          // Text colors
          '--color-text': '#1F2937',           // Dark gray for body text
          '--color-heading': '#0052A3',        // Dark blue for headings
          '--color-secondary': '#6B7280',      // Medium gray for secondary
          
          // Background colors
          '--color-background': '#F9FAFB',     // Very light gray
          '--color-surface': '#FFFFFF',        // White for surfaces
          
          // Brand colors
          '--color-primary': '#0088FF',        // Primary brand blue
          '--color-light-blue': '#5BA3FF',     // Light blue
          '--color-dark-blue': '#0052A3',      // Dark blue
          '--color-button': '#0052A3',         // Unified button color
          '--color-brand': '#0530ad',          // VitalLink brand color
          '--color-accent': '#00D4FF',         // Cyan accent
          
          // RGB variants for alpha blending
          '--primary-rgb': '0 136 255',
          '--accent-rgb': '0 212 255',
          '--surface-rgb': '255 255 255',
          '--button-rgb': '5 48 173',
          
          // Glass variables
          '--glass-bg': 'rgba(255, 255, 255, 0.75)',
          '--glass-border': 'rgba(0, 136, 255, 0.2)',
        },
        
        // 🌙 Dark Mode - Premium black background with blue accents
        '.dark': {
          // Text colors
          '--color-text': '#FFFFFF',           // Pure white for body
          '--color-heading': '#5BA3FF',        // Light blue for headings in dark mode
          '--color-secondary': '#8B95B8',      // Muted slate for secondary
          
          // Background colors
          '--color-background': '#0a0a0a',     // Pure black background
          '--color-surface': '#111827',        // Deep dark surface
          
          // Brand colors
          '--color-primary': '#0088FF',        // Primary brand blue
          '--color-light-blue': '#5BA3FF',     // Light blue
          '--color-dark-blue': '#0052A3',      // Dark blue for strong contrast
          '--color-button': '#0052A3',         // Unified button color
          '--color-brand': '#0530ad',          // VitalLink brand color
          '--color-accent': '#00D4FF',         // Shiny cyan accent
          
          // RGB variants for alpha blending
          '--primary-rgb': '0 136 255',
          '--accent-rgb': '0 212 255',
          '--surface-rgb': '17 24 39',
          '--button-rgb': '5 48 173',
          
          // Glass variables
          '--glass-bg': 'rgba(17, 24, 39, 0.4)',
          '--glass-border': 'rgba(0, 136, 255, 0.25)',
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
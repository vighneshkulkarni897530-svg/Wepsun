/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wepsun: {
          primary: '#123B5D',     // Deep Navy Blue
          secondary: '#1976D2',   // Professional Blue
          accent: '#00A896',      // Teal / Green
          bg: '#F5F8FA',          // Light Blue Canvas
          card: '#FFFFFF',        // White
          charcoal: '#263238',    // Text Charcoal
          success: '#2E7D32',     // Success Green
          warning: '#F9A825',     // Warning Amber
          error: '#D32F2F',       // Error / Emergency Red
          pending: '#607D8B',     // Pending Slate Grey
        },
        brand: {
          50: '#eef6fb',
          100: '#d7eaf6',
          200: '#b4d7ee',
          300: '#81bde2',
          400: '#489fd4',
          500: '#1976D2', // WEPSUN Professional Blue
          600: '#125aa3',
          700: '#123B5D', // WEPSUN Deep Navy Blue
          800: '#0e2b45',
          900: '#0a1d30',
        },
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#123B5D', // WEPSUN Deep Navy
          950: '#0c1427',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['Inter', 'Manrope', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Inter', 'Manrope', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        'card-soft': '0 2px 10px 0 rgba(18, 59, 93, 0.06), 0 1px 3px 0 rgba(18, 59, 93, 0.04)',
        'card-hover': '0 8px 24px 0 rgba(18, 59, 93, 0.10), 0 2px 6px 0 rgba(18, 59, 93, 0.05)',
        'emergency': '0 8px 30px 0 rgba(211, 47, 47, 0.35)',
      }
    },
  },
  plugins: [],
}

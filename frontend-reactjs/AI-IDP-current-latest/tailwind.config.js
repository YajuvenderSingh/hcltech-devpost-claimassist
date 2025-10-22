/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Roboto', 'system-ui', 'sans-serif'],
        'hcl': ['Roboto', 'Arial', 'sans-serif'],
      },
      colors: {
        // HCLTech Actual Brand Colors
        'hcl': {
          'primary': '#0066cc',      // HCL Blue
          'secondary': '#00a651',    // HCL Green  
          'dark': '#1a1a1a',        // HCL Dark
          'light': '#f5f5f5',       // HCL Light Gray
          'orange': '#ff6600',       // HCL Orange
          'purple': '#6b2c91',       // HCL Purple
          'navy': '#003366',         // HCL Navy
          'teal': '#00b4a6',         // HCL Teal
          'red': '#e31837',          // HCL Red
          'yellow': '#ffd100',       // HCL Yellow
        },
        // Updated grays to match HCL
        'gray': {
          50: '#fafafa',
          100: '#f5f5f5', 
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        }
      },
      backgroundImage: {
        'hcl-gradient': 'linear-gradient(135deg, #0066cc 0%, #003366 100%)',
        'hcl-gradient-light': 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
      }
    },
  },
  plugins: [],
}

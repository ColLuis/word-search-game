/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        canvas: '#FAF3E7', // warm cream page background
        surface: '#F4E9D6', // card / panel background
        'surface-sunken': '#ECDFC7', // input fields, tray backgrounds

        // Ink (text)
        ink: {
          DEFAULT: '#6F3F1F', // primary warm brown
          soft: '#9A6B45',
          muted: '#B89172',
        },

        // Tile face
        tile: {
          face: '#FFFFFF',
          edge: '#E8D9BE',
        },

        // Accents (each has an edge shade for chunky 3D buttons)
        accent: {
          orange: '#E59458',
          'orange-edge': '#C77638',
          green: '#3F7A5C',
          'green-edge': '#2E5C45',
          red: '#C44A3B',
          'red-edge': '#94372C',
          teal: '#7AA9A3',
          'teal-edge': '#5A857F',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        tile: '0 2px 0 0 #E8D9BE, 0 4px 6px -2px rgba(111, 63, 31, 0.15)',
        'tile-pressed': '0 1px 0 0 #E8D9BE, 0 1px 2px 0 rgba(111, 63, 31, 0.2)',
        card: '0 2px 0 0 rgba(111, 63, 31, 0.08), 0 6px 16px -6px rgba(111, 63, 31, 0.18)',
      },
      letterSpacing: {
        wider2: '0.15em',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // TOTH Academic Serenity Design Tokens
        primary: {
          DEFAULT: '#2D4A3E', // Verde Musgo Profundo: Botones principales, headers, estado activo
          dark: '#22382F',
          light: '#3D6253',
        },
        accent: {
          DEFAULT: '#C87D55', // Terracota Suave: Toggles ON, loaders, badges destacados
          strong: '#A65C38',
          soft: '#F6E7DD',
          dark: '#B06B45',
          light: '#D9936D',
        },
        toth: {
          moss: '#2D4A3E',       // Verde Musgo Profundo
          terracotta: '#C87D55', // Terracota Suave
          cream: '#FDFBF7',      // Crema Cálido (Fondo global)
          white: '#FFFFFF',      // Blanco Puro (Superficies, cards, inputs)
          slate: '#1E293B',      // Pizarra Oscuro (Texto principal)
          ash: '#64748B',        // Gris Ceniza (Texto secundario, subtítulos, placeholders)
          mint: '#E8EFEA',       // Verde Menta Suave (Banners, badge "RAG institucional validado")
          inactive: '#E2E8F0',   // Gris Inactivo (Toggle OFF)
        },
        background: '#FDFBF7',
        surface: '#FFFFFF',
        surfaceMuted: '#F7F3EC',
        surfaceSunken: '#F1EDE4',
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        validation: '#E8EFEA',
        accentStrong: '#A65C38',
        accentSoft: '#F6E7DD',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        xxl: '24px',
        xxxl: '32px',
      },
      fontFamily: {
        lexend: ['Lexend', 'sans-serif'],
        'lexend-light': ['Lexend-Light', 'Lexend', 'sans-serif'],
        'lexend-regular': ['Lexend-Regular', 'Lexend', 'sans-serif'],
        'lexend-medium': ['Lexend-Medium', 'Lexend', 'sans-serif'],
        'lexend-semibold': ['Lexend-SemiBold', 'Lexend', 'sans-serif'],
        'lexend-bold': ['Lexend-Bold', 'Lexend', 'sans-serif'],
      },
      borderRadius: {
        'card': '1rem',      // 16px (rounded-2xl)
        'input': '0.75rem',  // 12px (rounded-xl)
      },
    },
  },
  plugins: [],
};

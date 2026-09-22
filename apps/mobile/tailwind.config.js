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
          DEFAULT: '#2D4A3E', // Deep Moss green: Principal Buttons, headers, active state
          dark: '#22382F',
          light: '#3D6253',
        },
        accent: {
          DEFAULT: '#C87D55', // Soft terracotta: Toggles ON, loaders, highlight badges
          dark: '#B06B45',
          light: '#D9936D',
        },
        toth: {
          moss: '#2D4A3E',       // Deep Moss Green
          terracotta: '#C87D55', // Soft terracotta
          cream: '#FDFBF7',      // Warm Cream (Global Background)
          white: '#FFFFFF',      // Pure White (Surfaces, cards, inputs)
          slate: '#1E293B',      // Dark slate (Principal Text)
          ash: '#64748B',        // Ash Grey (Secondary text, subtitles, placeholders)
          mint: '#E8EFEA',       // Soft mint green (Banners, badge "RAG institucional validado")
          inactive: '#E2E8F0',   // Inactive Grey (Toggle OFF)
        },
        background: '#FDFBF7',
        surface: '#FFFFFF',
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        validation: '#E8EFEA',
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

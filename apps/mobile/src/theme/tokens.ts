/**
 * TOTH Design System Tokens — "Serenidad Académica"
 * Fuente única de verdad para la identidad visual de TOTH (I.U. Pascual Bravo)
 * Consistente con AGENTS.md Sección 2
 */

export const colors = {
  // 2.1 Paleta de Color
  primary: '#2D4A3E',       // Verde Musgo Profundo — Botones principales, headers, estado activo de perfil
  accent: '#C87D55',        // Terracota Suave — Toggles ON (Anti-Cliché), loaders, badges destacados
  background: '#FDFBF7',    // Crema Cálido — Fondo de pantallas
  surface: '#FFFFFF',       // Blanco Puro — Cards, inputs, contenedores
  textPrimary: '#1E293B',   // Pizarra Oscuro — Títulos, cuerpo de texto
  textSecondary: '#64748B', // Gris Ceniza — Subtítulos, placeholders
  validation: '#E8EFEA',    // Verde Menta Suave — Banners informativos, badge "RAG institucional validado"
  
  // Estados y bordes
  border: 'rgba(45, 74, 62, 0.1)',     // Borde suave verde musgo (10% opacidad)
  borderFocus: '#2D4A3E',              // Borde activo/focus
  toggleOff: '#E2E8F0',                // Gris inactivo para Toggle OFF
  toggleThumb: '#FFFFFF',              // Thumb blanco de toggle

  // Estados de error
  errorBg: '#FEE2E2',                  // Fondo de banners de error
  errorBorder: '#EF4444',             // Borde de banners de error
  errorText: '#B91C1C',               // Texto de banners de error
  
  // Aliases semánticos
  mossGreen: '#2D4A3E',
  terracotta: '#C87D55',
  warmCream: '#FDFBF7',
  darkSlate: '#1E293B',
  ashGray: '#64748B',
  mintSoft: '#E8EFEA',
} as const;

export const typography = {
  fontFamily: {
    base: 'Lexend',
    light: 'Lexend-Light',
    regular: 'Lexend-Regular',
    medium: 'Lexend-Medium',
    semiBold: 'Lexend-SemiBold',
    bold: 'Lexend-Bold',
  },
  // Escalas tipográficas de AGENTS.md Sección 2.2
  scales: {
    display: {
      fontSize: 30, // 3xl
      lineHeight: 36,
      fontWeight: '700' as const,
      color: colors.primary,
      fontFamily: 'Lexend-Bold',
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 20, // xl
      lineHeight: 28,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      fontFamily: 'Lexend-SemiBold',
    },
    cardHeader: {
      fontSize: 16, // base
      lineHeight: 24,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      fontFamily: 'Lexend-SemiBold',
    },
    body: {
      fontSize: 14, // sm
      lineHeight: 22,
      fontWeight: '400' as const,
      color: colors.textPrimary,
      fontFamily: 'Lexend-Regular',
    },
    microCopy: {
      fontSize: 12, // xs
      lineHeight: 16,
      fontWeight: '500' as const,
      color: colors.textSecondary,
      fontFamily: 'Lexend-Medium',
    },
  },
} as const;

export const radii = {
  card: 16,     // rounded-2xl
  input: 12,    // rounded-xl
  badge: 9999,  // rounded-full
  button: 12,   // rounded-xl
} as const;

export const shadows = {
  card: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  paperFloating: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

export default {
  colors,
  typography,
  radii,
  shadows,
};

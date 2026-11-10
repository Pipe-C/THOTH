/**
 * TOTH Design System Tokens — "Serenidad Académica"
 * Fuente única de verdad para la identidad visual de TOTH (I.U. Pascual Bravo)
 * Consistente con AGENTS.md Sección 2
 */

export const colors = {
  // 2.1 Paleta de Color
  primary: '#2D4A3E',       // Verde Musgo Profundo — Botones principales, headers, estado activo de perfil
  primaryStrong: '#22382F', // Verde musgo profundo para interacción/pressed
  accent: '#C87D55',        // Terracota Suave — Toggles ON (Anti-Cliché), loaders, badges destacados
  accentStrong: '#A65C38',  // Terracota accesible para texto blanco en botones
  accentSoft: '#F6E7DD',    // Terracota lavado para badges y estados suaves
  background: '#FDFBF7',    // Crema Cálido — Fondo de pantallas
  surface: '#FFFFFF',       // Blanco Puro — Cards, inputs, contenedores
  surfaceMuted: '#F7F3EC',  // Superficie cálida para secciones secundarias
  surfaceSunken: '#F1EDE4', // Superficie hundida para chips y separadores
  textPrimary: '#1E293B',   // Pizarra Oscuro — Títulos, cuerpo de texto
  textSecondary: '#64748B', // Gris Ceniza — Subtítulos, placeholders
  validation: '#E8EFEA',    // Verde Menta Suave — Banners informativos, badge "RAG institucional validado"
  
  // Estados y bordes
  border: 'rgba(45, 74, 62, 0.12)',     // Borde suave verde musgo (12% opacidad)
  borderStrong: 'rgba(45, 74, 62, 0.24)',
  borderFocus: '#2D4A3E',              // Borde activo/focus
  toggleOff: '#E2E8F0',                // Gris inactivo para Toggle OFF
  toggleThumb: '#FFFFFF',              // Thumb blanco de toggle
  onPrimaryMuted: 'rgba(255, 255, 255, 0.74)',
  onAccent: '#FFFFFF',

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

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const sizes = {
  touchTarget: 44,
  input: 52,
  control: 48,
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
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '700' as const,
      color: colors.primary,
      fontFamily: 'Lexend-Bold',
      letterSpacing: -0.6,
    },
    title: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700' as const,
      color: colors.primary,
      fontFamily: 'Lexend-Bold',
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      fontFamily: 'Lexend-SemiBold',
    },
    cardHeader: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      fontFamily: 'Lexend-SemiBold',
    },
    body: {
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '400' as const,
      color: colors.textPrimary,
      fontFamily: 'Lexend-Regular',
    },
    label: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
      color: colors.textSecondary,
      fontFamily: 'Lexend-Medium',
    },
    microCopy: {
      fontSize: 12,
      lineHeight: 17,
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
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  paperFloating: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
} as const;

export default {
  colors,
  spacing,
  sizes,
  typography,
  radii,
  shadows,
};

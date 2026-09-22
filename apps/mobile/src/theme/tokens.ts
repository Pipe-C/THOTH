/**
 * THOTH Design System Tokens — "Serenidad Académica"
 * Unique and Truthfully source for THOTH (I.U. Pascual Bravo) visual identity
 */

export const colors = {
  // 2.1 Color palette
  primary: '#2D4A3E',       // Deep Moss Green — Principal buttons, headers, active profile state
  accent: '#C87D55',        // Soft terracotta — Toggles ON (Anti-Cliché), loaders, highlight badges
  background: '#FDFBF7',    // Warm Cream — Screens background
  surface: '#FFFFFF',       // Pure White — Cards, inputs, containers
  textPrimary: '#1E293B',   // Dark slate — Titles, body text
  textSecondary: '#64748B', // Ash Grey — Subtitles, placeholders
  validation: '#E8EFEA',    // Soft mint green  — Informative Banners , badge "RAG institucional validado"

  // States and borders
  border: 'rgba(45, 74, 62, 0.1)',     // Deep moss green border (10% opacity)
  borderFocus: '#2D4A3E',              // Active border/focus
  toggleOff: '#E2E8F0',                // Inactive Grey for Toggle OFF
  toggleThumb: '#FFFFFF',              // White toggle Thumb

  // Error states
  errorBg: '#FEE2E2',                  // Error banners background
  errorBorder: '#EF4444',             // Error banners border
  errorText: '#B91C1C',               // Error banners text
  
  // Semantic aliases
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
  // Typographic scales
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

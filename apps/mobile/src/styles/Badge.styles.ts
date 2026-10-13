import { StyleSheet } from 'react-native';
import { colors, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  badgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  textBase: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
  },
  // Institutional: Verde Menta Suave (#E8EFEA) con texto Verde Musgo Profundo (#2D4A3E)
  institutionalContainer: {
    backgroundColor: colors.validation,
  },
  institutionalText: {
    color: colors.primary,
  },
  // Web: Gris Inactivo con texto Gris Ceniza
  webContainer: {
    backgroundColor: colors.toggleOff,
  },
  webText: {
    color: colors.textSecondary,
  },
  // Accent: Terracota Suave con texto blanco
  accentContainer: {
    backgroundColor: colors.accent,
  },
  accentText: {
    color: colors.surface,
  },
  // Outline: Borde fino con texto Verde Musgo
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineText: {
    color: colors.primary,
  },
  // Neutral
  neutralContainer: {
    backgroundColor: '#F1F5F9',
  },
  neutralText: {
    color: colors.textPrimary,
  },
});

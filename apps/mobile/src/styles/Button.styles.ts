import { StyleSheet } from 'react-native';
import { colors, radii, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button,
  },
  textBase: {
    fontFamily: typography.fontFamily.semiBold,
    textAlign: 'center',
  },
  // Variants
  primaryContainer: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.surface,
  },
  accentContainer: {
    backgroundColor: colors.accent,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  outlineText: {
    color: colors.primary,
  },
  secondaryContainer: {
    backgroundColor: colors.validation,
  },
  secondaryText: {
    color: colors.primary,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  // Sizes
  sizeSm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sizeMd: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  sizeLg: {
    paddingVertical: 18,
    paddingHorizontal: 26,
  },
  textSizeSm: {
    fontSize: 13,
  },
  textSizeMd: {
    fontSize: 15,
  },
  textSizeLg: {
    fontSize: 17,
  },
  // Disabled
  disabledContainer: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textSecondary,
  },
});

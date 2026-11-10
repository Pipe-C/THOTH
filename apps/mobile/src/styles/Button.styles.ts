import { StyleSheet } from 'react-native';
import { colors, radii, sizes, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button,
    minHeight: sizes.touchTarget,
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
    backgroundColor: colors.accentStrong,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
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
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  sizeMd: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sizeLg: {
    minHeight: 52,
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  textSizeSm: {
    fontSize: 13,
  },
  textSizeMd: {
    fontSize: 15,
  },
  textSizeLg: {
    fontSize: 16,
  },
  // Disabled
  disabledContainer: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textSecondary,
  },
});

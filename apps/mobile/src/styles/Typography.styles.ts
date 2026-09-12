import { StyleSheet } from 'react-native';
import { colors, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  display: {
    fontSize: typography.scales.display.fontSize,
    lineHeight: typography.scales.display.lineHeight,
    fontWeight: typography.scales.display.fontWeight,
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: typography.scales.subtitle.fontSize,
    lineHeight: typography.scales.subtitle.lineHeight,
    fontWeight: typography.scales.subtitle.fontWeight,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.semiBold,
  },
  cardHeader: {
    fontSize: typography.scales.cardHeader.fontSize,
    lineHeight: typography.scales.cardHeader.lineHeight,
    fontWeight: typography.scales.cardHeader.fontWeight,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.semiBold,
  },
  body: {
    fontSize: typography.scales.body.fontSize,
    lineHeight: typography.scales.body.lineHeight,
    fontWeight: typography.scales.body.fontWeight,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
  },
  microCopy: {
    fontSize: typography.scales.microCopy.fontSize,
    lineHeight: typography.scales.microCopy.lineHeight,
    fontWeight: typography.scales.microCopy.fontWeight,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
  },
});

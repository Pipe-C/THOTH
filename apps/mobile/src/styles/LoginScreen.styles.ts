import { StyleSheet } from 'react-native';
import { colors, radii, sizes, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 0,
    marginBottom: 8,
  },
  headerDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    marginBottom: 24,
  },
  cardTitle: {
    marginBottom: 6,
  },
  formHint: {
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: colors.errorText,
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
  },
  roleLabel: {
    marginTop: 18,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleChip: {
    flex: 1,
    minHeight: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleChipText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: typography.fontFamily.medium,
  },
  roleChipTextActive: {
    color: colors.onAccent,
  },
  submitButton: {
    marginTop: 20,
  },
  skipButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
  demoFillContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  demoFillLabel: {
    marginBottom: 10,
    color: colors.textSecondary,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBadge: {
    flex: 1,
    minHeight: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.validation,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
  },
  footer: {
    alignItems: 'center',
    gap: 14,
    marginTop: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  registerLink: {
    paddingVertical: 2,
  },
  registerLinkText: {
    color: colors.accent,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 12,
  },
  roleConfigLink: {
    paddingVertical: 4,
  },
  roleConfigLinkText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});

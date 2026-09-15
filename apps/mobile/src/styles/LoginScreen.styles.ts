import { StyleSheet } from 'react-native';
import { colors, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 6,
  },
  headerDescription: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  card: {
    marginBottom: 20,
  },
  cardTitle: {
    marginBottom: 16,
  },
  errorBanner: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    color: colors.errorText,
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
  },
  submitButton: {
    marginTop: 6,
  },
  skipButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  demoFillContainer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  demoFillLabel: {
    marginBottom: 8,
    color: colors.textSecondary,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBadge: {
    backgroundColor: colors.validation,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  demoBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
  },
  footer: {
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
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

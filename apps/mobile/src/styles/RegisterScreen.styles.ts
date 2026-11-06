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
  submitButton: {
    marginTop: 8,
  },
  skipButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  loginLink: {
    paddingVertical: 4,
  },
  loginLinkText: {
    color: colors.accent,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 12,
  },
});
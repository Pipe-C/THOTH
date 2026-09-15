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
    paddingTop: 24,
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
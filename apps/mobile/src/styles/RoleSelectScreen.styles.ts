import { StyleSheet } from 'react-native';
import { colors, radii, shadows, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  topRow: {
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
  roleCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    ...shadows.card,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  roleCardInactive: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roleTitleGroup: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  roleSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: typography.fontFamily.medium,
    color: colors.accentStrong,
    marginTop: 2,
  },
  rolePoints: {
    gap: 8,
  },
  rolePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rolePointDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
    marginTop: 8,
    marginRight: 10,
  },
  rolePointText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 21,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
  },
  boldText: {
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  actions: {
    marginTop: 14,
  },
  continueButton: {
    marginBottom: 12,
  },
  switchNotice: {
    textAlign: 'center',
  },
});

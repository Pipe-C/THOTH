import { StyleSheet } from 'react-native';
import { colors, radii } from '../theme/tokens';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  topRow: {
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
    lineHeight: 20,
  },
  roleCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  roleCardInactive: {
    borderColor: colors.border,
    backgroundColor: '#FAF9F6',
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
    fontFamily: 'Lexend-SemiBold',
    color: colors.textPrimary,
  },
  roleSubtitle: {
    fontSize: 12,
    fontFamily: 'Lexend-Medium',
    color: colors.accent,
    marginTop: 2,
  },
  roleBody: {
    fontSize: 13,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  boldText: {
    fontFamily: 'Lexend-SemiBold',
    color: colors.primary,
  },
  actions: {
    marginTop: 12,
  },
  continueButton: {
    marginBottom: 12,
  },
  switchNotice: {
    textAlign: 'center',
  },
});

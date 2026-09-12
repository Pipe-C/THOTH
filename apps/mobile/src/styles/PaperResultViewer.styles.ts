import { StyleSheet } from 'react-native';
import { colors, radii, shadows, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  outerContainer: {
    paddingVertical: 8,
  },
  paperSheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    ...shadows.paperFloating,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    lineHeight: 26,
  },
  date: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginTop: 4,
  },
  contentScroll: {
    maxHeight: 380,
  },
  scrollContent: {
    paddingVertical: 6,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 24,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    marginTop: 14,
  },
  exportGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    backgroundColor: colors.validation,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: colors.toggleOff,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonSecondaryText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  iconButtonText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
  },
});

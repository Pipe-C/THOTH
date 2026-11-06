import { StyleSheet } from 'react-native';
import { colors, radii, shadows, sizes, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  identityBlock: {
    flex: 1,
  },
  appTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    letterSpacing: -0.4,
  },
  userEmail: {
    marginTop: 2,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: sizes.touchTarget,
    backgroundColor: colors.validation,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newChatButton: {
    flex: 1,
  },
  filterBar: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    minHeight: sizes.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
  },
  docItemCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ragBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
  },
  docTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    lineHeight: 23,
    marginBottom: 4,
  },
  docPreview: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  docFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  openHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  openHint: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.accentStrong,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.validation,
    marginBottom: 12,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    marginTop: 6,
  },
});

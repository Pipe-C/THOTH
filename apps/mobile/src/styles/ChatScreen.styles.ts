import { StyleSheet } from 'react-native';
import { colors, radii, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 10,
  },
  antiClicheBar: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggleContainer: {
    paddingVertical: 2,
  },
  templateBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  templateScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  templateChip: {
    backgroundColor: colors.validation,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateChipText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  chatScroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  userBubbleContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 14,
    maxWidth: '85%',
  },
  userBubbleText: {
    color: colors.surface,
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  assistantViewerContainer: {
    marginBottom: 16,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 8,
  },
  generatingText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  inputBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: colors.textPrimary,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    marginBottom: 4,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: colors.surface,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 12,
  },
  ragDisclaimer: {
    textAlign: 'center',
    marginTop: 6,
    fontSize: 10,
  },
});

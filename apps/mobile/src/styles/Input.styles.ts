import { StyleSheet } from 'react-native';
import { colors, radii, sizes, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.input,
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputFocused: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  inputError: {
    borderColor: colors.errorBorder,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
    padding: 0,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.errorText,
    fontFamily: typography.fontFamily.regular,
    marginTop: 6,
  },
});

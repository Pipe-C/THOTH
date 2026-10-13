import { StyleSheet } from 'react-native';
import { colors, radii, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
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
    backgroundColor: colors.surface,
    borderRadius: radii.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
    padding: 0,
  },
  iconContainer: {
    marginRight: 8,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontFamily: typography.fontFamily.regular,
    marginTop: 4,
  },
});

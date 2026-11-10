import { StyleSheet } from 'react-native';
import { colors, sizes, typography } from '../theme/tokens';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: sizes.touchTarget,
    paddingVertical: 8,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  icon: {
    marginRight: 10,
  },
  copy: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  description: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  track: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.toggleThumb,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});

import { StyleSheet } from 'react-native';
import { colors, radii, shadows } from '../theme/tokens';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    ...shadows.card,
  },
  elevated: {
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  paper: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    ...shadows.paperFloating,
  },
});

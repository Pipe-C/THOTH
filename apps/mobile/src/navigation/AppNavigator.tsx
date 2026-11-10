import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/tokens';

const TothNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
  },
};

export function AppNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer theme={TothNavigationTheme}>
      {session ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

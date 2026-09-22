import React from 'react';
import { AuthStackParamList } from "../types/navigation";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { RootStackParamList } from '../types/navigation';
import { colors } from '../theme/tokens';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator(){
  return (
    <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: 'fade_from_bottom',
        }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        // options={{ title: 'Login' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        // options={{ title: 'Register' }}
      />
    </Stack.Navigator>
  );
}
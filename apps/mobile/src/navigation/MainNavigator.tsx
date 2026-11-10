import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainStackParamList } from "../types/navigation";
import {
  RoleSelectScreen,
  DirectoryScreen,
  ChatScreen,
} from '../screens';
import { colors } from '../theme/tokens';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * MainNavigator — Decides the initial route based on whether the user
 * already has a saved profile (session.profile).
 *
 * • First login or guest → RoleSelect (profile selection).
 * • Subsequent logins with a saved profile → Directory directly.
 */
export function MainNavigator() {
  const { session } = useAuth();

  // If the session already carries a confirmed profile, skip RoleSelect
  // and land directly on Directory. The user can still reach RoleSelect
  // from the Directory header to switch roles.
  const hasProfile = Boolean(session?.profile);
  const initialRoute: keyof MainStackParamList = hasProfile ? 'Directory' : 'RoleSelect';

  return (
    <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: 'fade_from_bottom',
        }}
    >
        <Stack.Screen
            name="RoleSelect"
            component={RoleSelectScreen}
        />
        <Stack.Screen
            name="Directory"
            component={DirectoryScreen}
        />
        <Stack.Screen
            name="Chat"
            component={ChatScreen}
        />
    </Stack.Navigator>
  );
}

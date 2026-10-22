import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainStackParamList } from "../types/navigation";
import {
  RoleSelectScreen,
  DirectoryScreen,
  ChatScreen,
} from '../screens';
import { colors } from '../theme/tokens';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator
        initialRouteName="RoleSelect"
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
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/main/WelcomeScreen';
import LoginSignUpResetScreen from '../screens/main/LoginSignUpResetScreen';
import { Colors } from '../constants/colors';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  LoginSignUp: { mode?: 'login' | 'signup' | 'reset' };
};

export type AuthStackNav = NativeStackNavigationProp<AuthStackParamList>;
export type WelcomeNav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
export type LoginSignUpRoute = RouteProp<AuthStackParamList, 'LoginSignUp'>;

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.white },
        headerShadowVisible: false,
        headerTintColor: Colors.black80,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LoginSignUp"
        component={LoginSignUpResetScreen}
        options={{ headerShown: false, animation: 'none', gestureEnabled: false }}
        initialParams={{ mode: 'signup' }}
      />
    </Stack.Navigator>
  );
}

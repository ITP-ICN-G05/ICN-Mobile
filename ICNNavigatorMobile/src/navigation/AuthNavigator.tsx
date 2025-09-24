import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/main/WelcomeScreen';
import LoginSignUpResetScreen from '../screens/main/LoginSignUpResetScreen';
import { Colors } from '../constants/colors';

export type AuthStackParamList = {
  Welcome: undefined;
  LoginSignUp: { mode?: 'login' | 'signup' | 'reset' };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.black80,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
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
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
    </Stack.Navigator>
  );
}
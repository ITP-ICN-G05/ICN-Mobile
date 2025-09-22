// Update App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { UserTierProvider } from './src/contexts/UserTierContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <UserTierProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <BottomTabNavigator />
        </NavigationContainer>
      </UserTierProvider>
    </SafeAreaProvider>
  );
}
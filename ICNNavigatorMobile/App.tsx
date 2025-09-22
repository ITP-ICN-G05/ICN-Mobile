import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { UserTierProvider } from './src/contexts/UserTierContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <UserTierProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </UserTierProvider>
    </SafeAreaProvider>
  );
}
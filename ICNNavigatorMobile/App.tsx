import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { UserTierProvider } from './src/contexts/UserTierContext';
import { UserProvider } from './src/contexts/UserContext';
import { SettingsProvider } from './src/contexts/SettingsContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <SettingsProvider>
          <UserTierProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <RootNavigator />
            </NavigationContainer>
          </UserTierProvider>
        </SettingsProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
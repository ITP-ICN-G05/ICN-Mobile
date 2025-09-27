import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/contexts/UserContext';
import { UserTierProvider } from './src/contexts/UserTierContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { ProfileProvider } from './src/contexts/ProfileContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <ProfileProvider>
          <SettingsProvider>
            <UserTierProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </UserTierProvider>
          </SettingsProvider>
        </ProfileProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}

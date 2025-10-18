import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProvider } from './src/contexts/UserContext';
import { UserTierProvider } from './src/contexts/UserTierContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { ProfileProvider } from './src/contexts/ProfileContext';
import { BookmarkProvider } from './src/contexts/BookmarkContext';
import { FilterProvider } from './src/contexts/FilterContext';
import { AuthGate } from './src/components/AuthGate';
// import ApiIntegrationTest from './src/components/ApiIntegrationTest'; // API Test component - DISABLED

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <AuthGate>  {/* New: Wait for auth hydration to complete */}
          <ProfileProvider>
            <SettingsProvider>
              <UserTierProvider>
                <BookmarkProvider>
                  <FilterProvider>  {/* New: Global filter state for CompaniesScreen and MapScreen sync */}
                    <StatusBar style="auto" />
                    <AppNavigator />
                    {/* <ApiIntegrationTest /> */} {/* API Test component - DISABLED for real app testing */}
                  </FilterProvider>
                </BookmarkProvider>
              </UserTierProvider>
            </SettingsProvider>
          </ProfileProvider>
        </AuthGate>
      </UserProvider>
    </SafeAreaProvider>
  );
}

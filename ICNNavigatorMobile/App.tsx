import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from './src/contexts/UserContext';
import { UserTierProvider } from './src/contexts/UserTierContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { ProfileProvider } from './src/contexts/ProfileContext';
import ApiIntegrationTest from './src/components/ApiIntegrationTest'; // 导入测试组件

export default function App() {
  // 临时渲染测试组件
  return (
    <SafeAreaProvider>
      <UserProvider>
        <ProfileProvider>
          <SettingsProvider>
            <UserTierProvider>
              <StatusBar style="auto" />
              <ApiIntegrationTest />
            </UserTierProvider>
          </SettingsProvider>
        </ProfileProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}

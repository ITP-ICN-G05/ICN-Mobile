
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';


// Root Navigator (includes Auth and Main)
function RootNavigator() {
  // This is where you would check authentication status
  // For now, we'll show the main tabs directly
  const isAuthenticated = true; // Replace with actual auth check
  
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <RootStack.Screen name="Auth" component={LoginSignUpResetScreen} />
      )}
      {/* Global Payment Modal - can be accessed from anywhere */}
      <RootStack.Group screenOptions={{ presentation: 'modal' }}>
        <RootStack.Screen 
          name="PaymentModal" 
          component={PaymentScreen}
          options={{
            animation: 'slide_from_bottom'
          }}
        />
      </RootStack.Group>
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <BottomTabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
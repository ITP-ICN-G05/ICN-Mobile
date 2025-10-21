import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingModal from '../components/common/OnboardingModal';
import { useUser } from '@/contexts/UserContext';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading, showOnboarding, setShowOnboarding } = useUser();
  
  console.log('AppNavigator - showOnboarding:', showOnboarding, 'isAuthenticated:', !!user);
  
  // Consider user authenticated if user data exists
  const isAuthenticated = !!user;

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('@onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  // Handle onboarding skip
  const handleOnboardingSkip = async () => {
    await AsyncStorage.setItem('@onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  if (isLoading) {
    // You can return a splash screen here
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
      
      {/* Onboarding modal */}
      {showOnboarding && (
        <OnboardingModal
          visible={showOnboarding}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </NavigationContainer>
  );
}
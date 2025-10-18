import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import PaymentScreen from '../screens/subscription/PaymentScreen';
import ManageSubscriptionScreen from '../screens/subscription/ManageSubscriptionScreen';
import { Colors } from '../constants/colors';

export type MainStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Payment: { planType?: string };
  ManageSubscription: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.white,
        },
        headerShadowVisible: false,
        headerTintColor: '#1B3E6F',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={BottomTabNavigator} 
        options={{ headerShown: false }}
      />
      
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: 'Edit Profile',
          headerBackTitle: 'Back',
          animation: 'slide_from_right'
        }}
      />
      
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{ 
          title: 'Change Password',
          headerBackTitle: 'Back',
          animation: 'slide_from_right'
        }}
      />
      
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ 
          title: 'Choose Your Plan',
          presentation: 'modal',
          headerShown: true
        }}
      />
      
      <Stack.Screen 
        name="ManageSubscription" 
        component={ManageSubscriptionScreen}
        options={{ 
          title: 'Manage Subscription',
          headerBackTitle: 'Back',
          animation: 'slide_from_right'
        }}
      />
    </Stack.Navigator>
  );
}

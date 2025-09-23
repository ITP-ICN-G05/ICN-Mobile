import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import PaymentScreen from '../screens/subscription/PaymentScreen';
import ManageSubscriptionScreen from '../screens/subscription/ManageSubscriptionScreen';
import { Colors } from '../constants/colors';

export type RootStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Payment: undefined;
  ManageSubscription: undefined;
  UpdatePayment: undefined;
  ComparePlans: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.black20,
        },
        headerTintColor: '#1B3E6F', // Match ProfileScreen blue theme
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={BottomTabNavigator} 
        options={{ headerShown: false }}
      />
      
      {/* Profile Screens */}
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: 'Edit Profile',
          presentation: 'card'
        }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{ 
          title: 'Change Password',
          presentation: 'card'
        }}
      />
      
      {/* Subscription Screens */}
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ 
          title: 'Choose Your Plan',
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="ManageSubscription" 
        component={ManageSubscriptionScreen}
        options={{ 
          title: 'Manage Subscription',
          presentation: 'card'
        }}
      />
    </Stack.Navigator>
  );
}
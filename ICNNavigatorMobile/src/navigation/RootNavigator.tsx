import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import { Colors } from '../constants/colors';

export type RootStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Payment: undefined; // Add this if you have a Payment screen
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
        headerTintColor: Colors.primary,
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
      {/* Add Payment screen if you have it */}
      {/* <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ 
          title: 'Subscription',
          presentation: 'card'
        }}
      /> */}
    </Stack.Navigator>
  );
}
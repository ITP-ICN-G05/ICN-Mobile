import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CompaniesScreen from '../screens/main/CompaniesScreen';
import CompanyDetailScreen from '../screens/main/CompanyDetailScreen';

const Stack = createNativeStackNavigator();

export default function CompaniesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CompaniesList" 
        component={CompaniesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CompanyDetail" 
        component={CompanyDetailScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from '../screens/main/MapScreen';
import CompanyDetailScreen from '../screens/main/CompanyDetailScreen';

const Stack = createNativeStackNavigator();

export default function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MapView" 
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CompanyDetail" 
        component={CompanyDetailScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom'
        }}
      />
    </Stack.Navigator>
  );
}

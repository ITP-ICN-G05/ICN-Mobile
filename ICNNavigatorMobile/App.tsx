import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './src/constants/colors';

// Import screens
import MapScreen from './src/screens/main/MapScreen';
import CompaniesScreen from './src/screens/main/CompaniesScreen';
import CompanyDetailScreen from './src/screens/main/CompanyDetailScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Companies Stack Navigator
function CompaniesStack({ navigation, route }: any) {
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

// Map Stack Navigator
function MapStack({ navigation, route }: any) {
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

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          
          if (route.name === 'Companies') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'location' : 'location-outline';
          } else {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.black50,
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.white,
      })}
    >
      <Tab.Screen 
        name="Companies" 
        component={CompaniesStack}
        options={({ route }) => ({
          headerShown: getFocusedRouteNameFromRoute(route) !== 'CompanyDetail',
          headerTitle: 'Companies',
          tabBarStyle: {
            display: getFocusedRouteNameFromRoute(route) === 'CompanyDetail' ? 'flex' : 'flex',
          },
        })}
      />
      <Tab.Screen 
        name="Map" 
        component={MapStack}
        options={({ route }) => ({
          headerShown: getFocusedRouteNameFromRoute(route) !== 'CompanyDetail',
          headerTitle: 'Map',
          tabBarStyle: {
            display: getFocusedRouteNameFromRoute(route) === 'CompanyDetail' ? 'flex' : 'flex',
          },
        })}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <MainTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
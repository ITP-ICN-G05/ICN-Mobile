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
import PaymentScreen from './src/screens/main/PaymentScreen';
import LoginSignUpResetScreen from './src/screens/main/LoginSignUpResetScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

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

// Profile Stack Navigator (includes Payment)
function ProfileStack({ navigation, route }: any) {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
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
        component={ProfileStack}
        options={({ route }) => ({
          headerShown: getFocusedRouteNameFromRoute(route) !== 'Payment',
          headerTitle: 'Profile',
          tabBarStyle: {
            display: getFocusedRouteNameFromRoute(route) === 'Payment' ? 'none' : 'flex',
          },
        })}
      />
    </Tab.Navigator>
  );
}

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
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
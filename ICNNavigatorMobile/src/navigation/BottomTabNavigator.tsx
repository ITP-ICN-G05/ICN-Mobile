import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute, useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import CompaniesStack from './CompaniesStack';
import MapStack from './MapStack';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        // Custom tab button with fixed activation state detection
        tabBarButton: ({ children, onPress, accessibilityState, style }) => {
          // Fix: Use navigation.getState() to get current active route
          const state = navigation.getState();
          const currentRoute = state.routes[state.index];
          const isFocused = currentRoute.name === route.name;
          
          return (
            <TouchableOpacity
              onPress={onPress}
              style={[
                style, 
                styles.tabButton,
                isFocused && styles.tabButtonActive // Apply correct activation state
              ]}
              activeOpacity={1} // Fix: Disable opacity change to avoid visual shift
            >
              {children}
            </TouchableOpacity>
          );
        },
        
        // Icon configuration
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          
          if (route.name === 'Companies') {
            iconName = 'list';
          } else if (route.name === 'Map') {
            iconName = 'location';
          } else {
            iconName = 'person';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        
        // Label text configuration
        tabBarLabel: ({ focused, children }) => (
          <Text style={[
            styles.tabLabel,
            { color: focused ? Colors.black80 : Colors.black50 }
          ]}>
            {children}
          </Text>
        ),
        
        // Navigation bar styles
        tabBarStyle: {
          backgroundColor: '#F6CA8B', // Navigation bar background
          borderTopWidth: 6, // Thick border 6px
          borderTopColor: '#FAE4C5', // Border color
          borderTopLeftRadius: 20, // Top left corner radius
          borderTopRightRadius: 20, // Top right corner radius
          borderBottomLeftRadius: 0, // Bottom left corner straight
          borderBottomRightRadius: 0, // Bottom right corner straight
          marginHorizontal: 0, // Ensure navigation bar is centered
          marginBottom: 0,
          height: 80,
          paddingTop: 0, // Remove top padding to allow button to cover border
          paddingBottom: 0, // Remove bottom padding to allow button to touch screen bottom
          paddingHorizontal: 0, // Ensure no horizontal padding
          shadowColor: Colors.black100,
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        
        // Tab item styles
        tabBarItemStyle: {
          borderTopLeftRadius: 16, // Button top left corner radius
          borderTopRightRadius: 16, // Button top right corner radius
          borderBottomLeftRadius: 0, // Button bottom left corner straight
          borderBottomRightRadius: 0, // Button bottom right corner straight
          marginHorizontal: 6, // Adjust spacing to maintain centered symmetry
          marginVertical: 0, // Remove vertical margin to allow button to touch top and bottom boundaries
          paddingTop: 0, // Remove top padding
          paddingBottom: 0, // Remove bottom padding
          overflow: 'visible', // Allow shadow display without clipping
        },
        
        // Color configuration
        tabBarActiveTintColor: Colors.black80,
        tabBarInactiveTintColor: Colors.black50,
        tabBarActiveBackgroundColor: 'transparent', // Handle background color through custom button
        tabBarInactiveBackgroundColor: 'transparent', // Inactive state transparent background
        
        // Header styles
        headerStyle: {
          backgroundColor: '#F8B657', // Top navigation bar background color
        },
        headerTintColor: '#FFFFFF', // White text is clearer on orange-yellow background
        headerTitleStyle: {
          fontSize: 20, // Increase font size
          fontWeight: '700', // Bold font
        },
      })}
    >
      <Tab.Screen 
        name="Companies" 
        component={CompaniesStack}
        options={({ route }) => ({
          headerShown: getFocusedRouteNameFromRoute(route) !== 'CompanyDetail',
          headerTitle: 'Companies',
        })}
      />
      <Tab.Screen 
        name="Map" 
        component={MapStack}
        options={{
          headerShown: false, // Completely hide Map page header
          headerStyle: {
            backgroundColor: 'transparent', // Ensure header background is transparent
          },
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          headerShown: false, // Hide Profile page header
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Tab label text styles
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  
  // Base tab button styles
  tabButton: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingBottom: 0, // Ensure no bottom padding
    marginHorizontal: 0, // Button internal horizontal margin
    marginVertical: 0, // Remove vertical margin to allow button to touch top and bottom boundaries
    marginTop: -6, // Precisely cover 6px border
    marginBottom: -10, // Extend downward beyond container boundary to touch screen bottom
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    // Ensure content position stability
    transform: [{ translateY: 0 }], // Prevent transform offset
  },
  
  // Active state button styles - this is the key fix
  tabButtonActive: {
    backgroundColor: '#F9A824', // Active button color
    opacity: 0.75, // Direct opacity setting (0.0 = fully transparent, 1.0 = fully opaque)
    shadowColor: '#000000', // Black shadow
    shadowOffset: {
      width: 0, // No horizontal offset, only downward
      height: 6, // Increase downward offset to 6px
    },
    shadowOpacity: 0.2, // Lower opacity for clearer shadow
    shadowRadius: 4, // Increase blur radius for softer shadow
    elevation: 4, // Increase Android shadow intensity
    // Modification: Move content up 5px in active state
    marginBottom: 0,
  },
});

// Fix summary:
// 1. Correctly apply isFocused && styles.tabButtonActive in tabBarButton
// 2. Ensure tabButtonActive style is defined
// 3. Removed undefined activeOverlay reference
// 4. Moved corner radius styles to base tabButton for consistency
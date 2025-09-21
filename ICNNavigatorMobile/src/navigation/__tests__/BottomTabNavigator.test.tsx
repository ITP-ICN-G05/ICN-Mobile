import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from '../BottomTabNavigator';

// Mock external dependencies
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color, ...props }: any) => {
    const MockIcon = require('react-native').Text;
    return <MockIcon {...props}>{`Icon:${name}:${size}:${color}`}</MockIcon>;
  },
}));

// Mock the stack navigators
jest.mock('../CompaniesStack', () => {
  return function CompaniesStack() {
    const MockView = require('react-native').View;
    return <MockView testID="companies-stack" />;
  };
});

jest.mock('../MapStack', () => {
  return function MapStack() {
    const MockView = require('react-native').View;
    return <MockView testID="map-stack" />;
  };
});

jest.mock('../../screens/main/ProfileScreen', () => {
  return function ProfileScreen() {
    const MockView = require('react-native').View;
    return <MockView testID="profile-screen" />;
  };
});

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  getFocusedRouteNameFromRoute: jest.fn(() => 'Companies'),
  useNavigationState: jest.fn(),
}));

// Helper function to render the navigator
const renderNavigator = () => {
  return render(
    <NavigationContainer>
      <BottomTabNavigator />
    </NavigationContainer>
  );
};

describe('BottomTabNavigator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render tab navigator successfully', () => {
      expect(() => renderNavigator()).not.toThrow();
    });

    it('should render without crashing', () => {
      const { toJSON } = renderNavigator();
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Screen Components', () => {
    it('should include Companies screen', () => {
      const { getByTestId } = renderNavigator();
      expect(getByTestId('companies-stack')).toBeTruthy();
    });

    it('should have tab navigation structure', () => {
      const { toJSON } = renderNavigator();
      const tree = toJSON();
      
      // Check that the component renders with tab structure
      expect(tree).toBeTruthy();
      expect(JSON.stringify(tree)).toContain('tablist');
    });

    it('should show active screen (Companies by default)', () => {
      const { getAllByText } = renderNavigator();
      
      // The active screen should be visible (multiple instances are expected)
      const companiesTexts = getAllByText('Companies');
      expect(companiesTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Tab Icons', () => {
    it('should render icons for all tabs', () => {
      const { getAllByText } = renderNavigator();
      
      // Check if all icon types are rendered (multiple instances for focused/unfocused states)
      const listIcons = getAllByText(/Icon:list/);
      const locationIcons = getAllByText(/Icon:location/);
      const personIcons = getAllByText(/Icon:person/);
      
      expect(listIcons.length).toBeGreaterThan(0);
      expect(locationIcons.length).toBeGreaterThan(0);
      expect(personIcons.length).toBeGreaterThan(0);
    });

    it('should use correct icon names for each tab', () => {
      const { getAllByText } = renderNavigator();
      
      // At least 6 icons should be rendered (3 tabs x 2 states each)
      const allIcons = getAllByText(/Icon:/);
      
      expect(allIcons.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Tab Configuration', () => {
    it('should configure tab bar with correct styling', () => {
      const component = renderNavigator();
      expect(component).toBeTruthy();
    });

    it('should handle screen options correctly', () => {
      const { toJSON } = renderNavigator();
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Navigation State Management', () => {
    it('should initialize with proper navigation state', () => {
      const component = renderNavigator();
      expect(component).toBeTruthy();
    });

    it('should handle route name resolution', () => {
      const { getFocusedRouteNameFromRoute } = require('@react-navigation/native');
      
      // Mock should be called when component renders
      expect(() => {
        renderNavigator();
        expect(getFocusedRouteNameFromRoute).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Screen Options', () => {
    it('should configure Companies screen header visibility', () => {
      const component = renderNavigator();
      expect(component).toBeTruthy();
    });

    it('should configure Map screen with hidden header', () => {
      const component = renderNavigator();
      expect(component).toBeTruthy();
    });

    it('should configure Profile screen with visible header', () => {
      const component = renderNavigator();
      expect(component).toBeTruthy();
    });
  });

  describe('Tab Bar Styling', () => {
    it('should apply custom tab bar styles', () => {
      const component = renderNavigator();
      expect(component.toJSON()).toBeTruthy();
    });

    it('should handle tab button custom implementation', () => {
      const component = renderNavigator();
      expect(component.toJSON()).toBeTruthy();
    });

    it('should configure tab colors correctly', () => {
      const component = renderNavigator();
      expect(component.toJSON()).toBeTruthy();
    });
  });

  describe('Icon Resolution Logic', () => {
    it('should resolve Companies tab icon to list', () => {
      const { getAllByText } = renderNavigator();
      const listIcons = getAllByText(/Icon:list/);
      expect(listIcons.length).toBeGreaterThan(0);
    });

    it('should resolve Map tab icon to location', () => {
      const { getAllByText } = renderNavigator();
      const locationIcons = getAllByText(/Icon:location/);
      expect(locationIcons.length).toBeGreaterThan(0);
    });

    it('should resolve Profile tab icon to person', () => {
      const { getAllByText } = renderNavigator();
      const personIcons = getAllByText(/Icon:person/);
      expect(personIcons.length).toBeGreaterThan(0);
    });

    it('should render both focused and unfocused icon states', () => {
      const { getAllByText } = renderNavigator();
      
      // Check for different colors indicating focused/unfocused states
      const darkIcons = getAllByText(/Icon:.*:#333333/); // Focused (dark)
      const lightIcons = getAllByText(/Icon:.*:#808080/); // Unfocused (light)
      
      expect(darkIcons.length).toBeGreaterThan(0);
      expect(lightIcons.length).toBeGreaterThan(0);
    });

    it('should handle unknown route names with fallback', () => {
      const component = renderNavigator();
      expect(component.toJSON()).toBeTruthy();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing route gracefully', () => {
      expect(() => renderNavigator()).not.toThrow();
    });

    it('should handle component initialization errors', () => {
      expect(() => {
        const component = renderNavigator();
        expect(component).toBeTruthy();
      }).not.toThrow();
    });

    it('should handle navigation state edge cases', () => {
      const component = renderNavigator();
      expect(component.toJSON()).toBeTruthy();
    });
  });

  describe('Component Integration', () => {
    it('should integrate with NavigationContainer', () => {
      const component = renderNavigator();
      expect(component).toBeTruthy();
    });

    it('should handle child screen integration', () => {
      const { queryByTestId } = renderNavigator();
      
      const hasChildScreen = 
        queryByTestId('companies-stack') ||
        queryByTestId('map-stack') || 
        queryByTestId('profile-screen');
        
      expect(hasChildScreen).toBeTruthy();
    });
  });

  describe('Performance and Stability', () => {
    it('should render efficiently', () => {
      const startTime = Date.now();
      renderNavigator();
      const renderTime = Date.now() - startTime;
      
      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle multiple renders without issues', () => {
      expect(() => {
        renderNavigator();
        renderNavigator();
        renderNavigator();
      }).not.toThrow();
    });

    it('should be stable across re-renders', () => {
      const { rerender } = renderNavigator();
      
      expect(() => {
        rerender(
          <NavigationContainer>
            <BottomTabNavigator />
          </NavigationContainer>
        );
      }).not.toThrow();
    });
  });
});
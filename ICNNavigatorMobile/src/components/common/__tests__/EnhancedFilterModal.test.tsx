// src/components/common/__tests__/EnhancedFilterModal.test.tsx
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import EnhancedFilterModal, { EnhancedFilterOptions } from '../EnhancedFilterModal';
import { useUserTier } from '../../../contexts/UserTierContext';

// Mock dependencies
jest.mock('../../../contexts/UserTierContext');
jest.mock('../FilterDropdown', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  return function MockFilterDropdown({ title }: any) {
    return React.createElement(View, { testID: `filter-dropdown-${title.toLowerCase().replace(/\s+/g, '-')}` }, [
      React.createElement(Text, { key: 'title' }, title),
      React.createElement(Text, { key: 'mock-indicator' }, 'FilterDropdown Mock')
    ]);
  };
});

// Mock useUserTier hook
const mockUseUserTier = useUserTier as jest.MockedFunction<typeof useUserTier>;

describe('EnhancedFilterModal Component', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onApply: jest.fn(),
    currentFilters: undefined,
    onNavigateToPayment: jest.fn(),
  };

  const mockFreeUserTier = {
    currentTier: 'free' as const,
    setCurrentTier: jest.fn(),
    features: {
      maxBookmarkFolders: 1,
      canCreateFolders: false,
      canFilterBySize: false,
      canFilterByCertifications: false,
      canFilterByDiversity: false,
      canFilterByRevenue: false,
      canExportFull: false,
      exportLimit: 10,
      canAccessChat: false,
      canSeeABN: false,
      canSeeRevenue: false,
      canSeeEmployeeCount: false,
      canSeeLocalContent: false,
    },
    checkFeatureAccess: jest.fn(),
  };

  const mockPlusUserTier = {
    currentTier: 'plus' as const,
    setCurrentTier: jest.fn(),
    features: {
      maxBookmarkFolders: 1,
      canCreateFolders: false,
      canFilterBySize: true,
      canFilterByCertifications: true,
      canFilterByDiversity: false,
      canFilterByRevenue: false,
      canExportFull: false,
      exportLimit: 50,
      canAccessChat: true,
      canSeeABN: true,
      canSeeRevenue: false,
      canSeeEmployeeCount: false,
      canSeeLocalContent: false,
    },
    checkFeatureAccess: jest.fn(),
  };

  const mockPremiumUserTier = {
    currentTier: 'premium' as const,
    setCurrentTier: jest.fn(),
    features: {
      maxBookmarkFolders: 10,
      canCreateFolders: true,
      canFilterBySize: true,
      canFilterByCertifications: true,
      canFilterByDiversity: true,
      canFilterByRevenue: true,
      canExportFull: true,
      exportLimit: -1,
      canAccessChat: true,
      canSeeABN: true,
      canSeeRevenue: true,
      canSeeEmployeeCount: true,
      canSeeLocalContent: true,
    },
    checkFeatureAccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserTier.mockReturnValue(mockFreeUserTier);
  });

  describe('Modal Rendering and Basic Behavior', () => {
    it('renders when visible prop is true', () => {
      const { getByText } = render(<EnhancedFilterModal {...defaultProps} />);
      expect(getByText('Filters')).toBeTruthy();
    });

    it('does not render when visible prop is false', () => {
      const { queryByText } = render(<EnhancedFilterModal {...defaultProps} visible={false} />);
      expect(queryByText('Filters')).toBeNull();
    });

    it('displays correct tier indicator', () => {
      const { getByText } = render(<EnhancedFilterModal {...defaultProps} />);
      expect(getByText('Your tier: FREE')).toBeTruthy();
    });

    it('shows Apply Filters and Reset All buttons', () => {
      const { getByText } = render(<EnhancedFilterModal {...defaultProps} />);
      expect(getByText('Apply Filters')).toBeTruthy();
      expect(getByText('Reset All')).toBeTruthy();
    });
  });

  describe('Tier-based Filter Access Control', () => {
    it('shows basic filters for free users', () => {
      mockUseUserTier.mockReturnValue(mockFreeUserTier);
      const { getByText } = render(<EnhancedFilterModal {...defaultProps} />);
      
      // These should always be visible
      expect(getByText('Capability Types')).toBeTruthy();
      expect(getByText('Sectors')).toBeTruthy();
      expect(getByText('Distance')).toBeTruthy();
      expect(getByText('Components/Items Search')).toBeTruthy();
    });

    it('shows locked features for free users', () => {
      mockUseUserTier.mockReturnValue(mockFreeUserTier);
      const { getByText, getAllByText } = render(<EnhancedFilterModal {...defaultProps} />);
      
      // These should show as locked for free users
      expect(getByText('Company Size Filter')).toBeTruthy();
      const plusTexts = getAllByText('Plus');
      expect(plusTexts.length).toBeGreaterThan(0); // Should have at least one Plus badge
    });

    it('shows plus features for plus users', () => {
      mockUseUserTier.mockReturnValue(mockPlusUserTier);
      const { getByText } = render(<EnhancedFilterModal {...defaultProps} />);
      
      // Plus users should see company size filter
      expect(getByText('Company Size')).toBeTruthy();
      expect(getByText('Certifications')).toBeTruthy();
    });

    it('shows premium features for premium users', () => {
      mockUseUserTier.mockReturnValue(mockPremiumUserTier);
      const { getByText } = render(<EnhancedFilterModal {...defaultProps} />);
      
      // Premium users should see all features
      expect(getByText('Ownership Type')).toBeTruthy();
      expect(getByText('Annual Revenue Range (AUD)')).toBeTruthy();
      expect(getByText('Employee Count Range')).toBeTruthy();
    });
  });

  describe('Filter State Management', () => {
    it('initializes with current filters when provided', () => {
      const currentFilters: EnhancedFilterOptions = {
        capabilities: ['Service Provider'],
        sectors: ['Technology'],
        distance: '50km',
        componentsItems: 'test search',
      };

      const { queryByText } = render(
        <EnhancedFilterModal {...defaultProps} currentFilters={currentFilters} />
      );

      // Component should render successfully with initial filters
      expect(queryByText('Filters')).toBeTruthy();
    });

    it('initializes with empty state when no current filters provided', () => {
      const { getByText } = render(<EnhancedFilterModal {...defaultProps} />);
      expect(getByText('Filters')).toBeTruthy();
    });
  });

  describe('Apply Filters Functionality', () => {
    it('applies basic filters and calls onApply', async () => {
      const mockOnApply = jest.fn();
      mockUseUserTier.mockReturnValue(mockFreeUserTier);
      
      const { getByText } = render(
        <EnhancedFilterModal {...defaultProps} onApply={mockOnApply} />
      );

      // Apply filters
      const applyButton = getByText('Apply Filters');
      fireEvent.press(applyButton);

      await waitFor(() => {
        expect(mockOnApply).toHaveBeenCalledWith(expect.objectContaining({
          capabilities: expect.any(Array),
          sectors: expect.any(Array),
          distance: expect.any(String),
        }));
      });
    });

    it('closes modal after applying filters', async () => {
      const mockOnClose = jest.fn();
      const { getByText } = render(
        <EnhancedFilterModal {...defaultProps} onClose={mockOnClose} />
      );

      const applyButton = getByText('Apply Filters');
      fireEvent.press(applyButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('applies all filters for premium user and calls onApply', async () => {
      const mockOnApply = jest.fn();
      mockUseUserTier.mockReturnValue(mockPremiumUserTier);
      
      const { getByText } = render(
        <EnhancedFilterModal {...defaultProps} onApply={mockOnApply} />
      );

      // Apply filters
      const applyButton = getByText('Apply Filters');
      fireEvent.press(applyButton);

      expect(mockOnApply).toHaveBeenCalledWith({
        capabilities: [],
        distance: 'All',
        sectors: [],
        componentsItems: undefined,
        companySize: 'All',
        certifications: [],
        ownershipType: [],
        socialEnterprise: false,
        australianDisability: false,
        revenue: { min: 0, max: 10000000 },
        employeeCount: { min: 0, max: 1000 },
        localContentPercentage: 0,
      });
    });
  });

  describe('Edge Case Handling', () => {
    it('handles invalid non-numeric input in revenue fields gracefully', () => {
      const mockOnApply = jest.fn();
      mockUseUserTier.mockReturnValue(mockPremiumUserTier);
      const { getByPlaceholderText, getByText } = render(
        <EnhancedFilterModal {...defaultProps} onApply={mockOnApply} />
      );

      const minRevenueInput = getByPlaceholderText('$0');
      const maxRevenueInput = getByPlaceholderText('$10,000,000');

      // Simulate entering invalid text
      fireEvent.changeText(minRevenueInput, 'invalid');
      fireEvent.changeText(maxRevenueInput, 'text');

      // Apply filters
      fireEvent.press(getByText('Apply Filters'));

      // The component should coerce invalid input to the default values
      expect(mockOnApply).toHaveBeenCalledWith(expect.objectContaining({
        revenue: { min: 0, max: 10000000 },
      }));
    });

    it('resets all filters to default when Reset All is pressed on an unchanged form', () => {
      const mockOnApply = jest.fn();
      mockUseUserTier.mockReturnValue(mockPremiumUserTier);
      const { getByText } = render(
        <EnhancedFilterModal {...defaultProps} onApply={mockOnApply} />
      );

      // Press Reset All without any changes
      fireEvent.press(getByText('Reset All'));

      // Then apply filters
      fireEvent.press(getByText('Apply Filters'));

      // Expect onApply to be called with all default/empty values
      expect(mockOnApply).toHaveBeenCalledWith({
        capabilities: [],
        sectors: [],
        distance: 'All',
        componentsItems: undefined,
        companySize: 'All',
        certifications: [],
        ownershipType: [],
        socialEnterprise: false,
        australianDisability: false,
        revenue: { min: 0, max: 10000000 },
        employeeCount: { min: 0, max: 1000 },
        localContentPercentage: 0,
      });
    });
  });
});

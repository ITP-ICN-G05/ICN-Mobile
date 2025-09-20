import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import FilterModal, { FilterOptions } from '../FilterModal';

// Mock the FilterDropdown component since it has complex behavior
jest.mock('../FilterDropdown', () => {
  // Use React directly within the mock factory
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  
  const MockedFilterDropdown = ({ title, selected, onApply }: any) => {
    return React.createElement(
      View,
      { testID: `filter-dropdown-${title}` },
      React.createElement(Text, {}, title),
      React.createElement(
        TouchableOpacity,
        {
          testID: `dropdown-trigger-${title}`,
          onPress: () => {
            // Simulate selecting options for capability filter
            if (title === 'Capability Filter') {
              onApply(['Service Provider']);
            }
          }
        },
        React.createElement(
          Text,
          {},
          Array.isArray(selected) && selected.length > 0 
            ? `${selected.length} selected` 
            : 'All'
        )
      )
    );
  };
  return MockedFilterDropdown;
});

describe('FilterModal Component', () => {
  const defaultFilters: FilterOptions = {
    capabilities: [],
    distance: 'All',
    verificationStatus: 'all',
  };

  const mockOnClose = jest.fn();
  const mockOnApply = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Behavior', () => {
    it('should not render when visible is false', () => {
      render(
        <FilterModal
          visible={false}
          onClose={mockOnClose}
          onApply={mockOnApply}
          currentFilters={defaultFilters}
        />
      );

      expect(screen.queryByText('Filters')).toBeNull();
    });

    it('should render when visible is true', () => {
      render(
        <FilterModal
          visible={true}
          onClose={mockOnClose}
          onApply={mockOnApply}
          currentFilters={defaultFilters}
        />
      );

      expect(screen.getByText('Filters')).toBeTruthy();
    });

    it('should call onClose when close button is pressed', () => {
      render(
        <FilterModal
          visible={true}
          onClose={mockOnClose}
          onApply={mockOnApply}
          currentFilters={defaultFilters}
        />
      );

      const closeButton = screen.getByTestId('close-button');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Filter Sections', () => {
    it('should render all filter sections', () => {
      render(
        <FilterModal
          visible={true}
          onClose={mockOnClose}
          onApply={mockOnApply}
          currentFilters={defaultFilters}
        />
      );

      expect(screen.getByText('Capability Filter')).toBeTruthy();
      expect(screen.getByText('Distance Filter')).toBeTruthy();
      expect(screen.getByText('Verification Status')).toBeTruthy();
    });

    it('should handle distance selection', () => {
      render(
        <FilterModal
          visible={true}
          onClose={mockOnClose}
          onApply={mockOnApply}
          currentFilters={defaultFilters}
        />
      );

      fireEvent.press(screen.getByText('5km'));
      const applyButton = screen.getByText('Apply Filters');
      fireEvent.press(applyButton);

      expect(mockOnApply).toHaveBeenCalledWith({
        capabilities: [],
        distance: '5km',
        verificationStatus: 'all',
      });
    });

    it('should handle verification status selection', () => {
      render(
        <FilterModal
          visible={true}
          onClose={mockOnClose}
          onApply={mockOnApply}
          currentFilters={defaultFilters}
        />
      );

      fireEvent.press(screen.getByText('Verified'));
      const applyButton = screen.getByText('Apply Filters');
      fireEvent.press(applyButton);

      expect(mockOnApply).toHaveBeenCalledWith({
        capabilities: [],
        distance: 'All',
        verificationStatus: 'Verified',
      });
    });
  });

  describe('Capability Filter Integration', () => {
    it('should handle capability filter dropdown interaction', () => {
      render(
        <FilterModal
          visible={true}
          onClose={mockOnClose}
          onApply={mockOnApply}
          currentFilters={defaultFilters}
        />
      );

      const dropdownTrigger = screen.getByTestId('dropdown-trigger-Capability Filter');
      fireEvent.press(dropdownTrigger);

      const applyButton = screen.getByText('Apply Filters');
      fireEvent.press(applyButton);

      expect(mockOnApply).toHaveBeenCalledWith({
        capabilities: ['Service Provider'],
        distance: 'All',
        verificationStatus: 'all',
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all filters', () => {
      render(
        <FilterModal
          visible={true}
          onClose={mockOnClose}
          onApply={mockOnApply}
          currentFilters={{
            capabilities: ['Service Provider'],
            distance: '5km',
            verificationStatus: 'verified',
          }}
        />
      );

      const resetButton = screen.getByText('Reset All');
      fireEvent.press(resetButton);

      const applyButton = screen.getByText('Apply Filters');
      fireEvent.press(applyButton);

      expect(mockOnApply).toHaveBeenCalledWith({
        capabilities: [],
        distance: 'All',
        verificationStatus: 'All',
      });
    });
  });
});
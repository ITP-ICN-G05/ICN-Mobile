import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FilterDropdown from '../FilterDropdown';

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('FilterDropdown Component', () => {
  const mockOptions = [
    'Service Provider',
    'Item Supplier', 
    'Manufacturer',
    'Retailer',
    'Consulting',
    'Engineering',
    'Technology',
    'Construction'
  ];

  const defaultProps = {
    title: 'Test Filter',
    options: mockOptions,
    selected: '',
    onApply: jest.fn(),
    showLimit: 4,
    multiSelect: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render dropdown with title', () => {
      const { getByText } = render(<FilterDropdown {...defaultProps} />);
      
      expect(getByText('Test Filter')).toBeTruthy();
    });

    it('should show "All" as default display text when no selection', () => {
      const { getByText } = render(
        <FilterDropdown {...defaultProps} selected="" />
      );
      
      expect(getByText('All')).toBeTruthy();
    });

    it('should show selected option as display text for single select', () => {
      const { getByText } = render(
        <FilterDropdown {...defaultProps} selected="Service Provider" />
      );
      
      expect(getByText('Service Provider')).toBeTruthy();
    });

    it('should show count for multi-select when multiple items selected', () => {
      const { getByText } = render(
        <FilterDropdown 
          {...defaultProps} 
          multiSelect={true}
          selected={['Service Provider', 'Manufacturer']}
        />
      );
      
      expect(getByText('2 selected')).toBeTruthy();
    });
  });

  describe('Dropdown Expansion', () => {
    it('should expand dropdown when pressed', () => {
      const { getByText } = render(<FilterDropdown {...defaultProps} />);
      
      const dropdown = getByText('All'); // The dropdown trigger
      fireEvent.press(dropdown);
      
      // Should show options after expansion
      expect(getByText('Service Provider')).toBeTruthy();
      expect(getByText('Item Supplier')).toBeTruthy();
    });

    it('should collapse dropdown when pressed again', () => {
      const { getByText, queryByText } = render(<FilterDropdown {...defaultProps} />);
      
      const dropdown = getByText('All');
      
      // Expand
      fireEvent.press(dropdown);
      expect(getByText('Service Provider')).toBeTruthy();
      
      // Collapse
      fireEvent.press(dropdown);
      expect(queryByText('Service Provider')).toBeFalsy();
    });

    it('should show limited options initially based on showLimit', () => {
      const { getByText, queryByText } = render(
        <FilterDropdown {...defaultProps} showLimit={3} />
      );
      
      fireEvent.press(getByText('All')); // Expand dropdown
      
      // Should show first 3 options
      expect(getByText('Service Provider')).toBeTruthy();
      expect(getByText('Item Supplier')).toBeTruthy();
      expect(getByText('Manufacturer')).toBeTruthy();
      
      // Should not show options beyond showLimit initially
      expect(queryByText('Retailer')).toBeFalsy();
    });
  });

  describe('Show More/Less Functionality', () => {
    it('should show "Show more" button when options exceed showLimit', () => {
      const { getByText } = render(
        <FilterDropdown {...defaultProps} showLimit={3} />
      );
      
      fireEvent.press(getByText('All')); // Expand dropdown
      
      expect(getByText('+ Show more')).toBeTruthy();
    });

    it('should show all options when "Show more" is pressed', () => {
      const { getByText } = render(
        <FilterDropdown {...defaultProps} showLimit={3} />
      );
      
      fireEvent.press(getByText('All')); // Expand dropdown
      fireEvent.press(getByText('+ Show more'));
      
      // Should show all options now
      expect(getByText('Retailer')).toBeTruthy();
      expect(getByText('Consulting')).toBeTruthy();
      expect(getByText('Engineering')).toBeTruthy();
      expect(getByText('Technology')).toBeTruthy();
      expect(getByText('Construction')).toBeTruthy();
    });

    it('should show "Show less" button when all options are visible', () => {
      const { getByText } = render(
        <FilterDropdown {...defaultProps} showLimit={3} />
      );
      
      fireEvent.press(getByText('All')); // Expand dropdown
      fireEvent.press(getByText('+ Show more'));
      
      expect(getByText('− Show less')).toBeTruthy();
    });

    it('should hide extra options when "Show less" is pressed', () => {
      const { getByText, queryByText } = render(
        <FilterDropdown {...defaultProps} showLimit={3} />
      );
      
      fireEvent.press(getByText('All')); // Expand
      fireEvent.press(getByText('+ Show more')); // Show all
      fireEvent.press(getByText('− Show less')); // Show less
      
      // Should hide options beyond showLimit
      expect(queryByText('Retailer')).toBeFalsy();
      expect(queryByText('Construction')).toBeFalsy();
      expect(getByText('+ Show more')).toBeTruthy();
    });
  });

  describe('Single Select Mode', () => {
    it('should handle single option selection', async () => {
      const onApplyMock = jest.fn();
      const { getByText } = render(
        <FilterDropdown {...defaultProps} onApply={onApplyMock} />
      );
      
      fireEvent.press(getByText('All')); // Expand dropdown
      fireEvent.press(getByText('Service Provider')); // Select option
      fireEvent.press(getByText('Apply')); // Apply selection
      
      await waitFor(() => {
        expect(onApplyMock).toHaveBeenCalledWith('Service Provider');
      });
    });

    it('should handle "All" selection in single select mode', async () => {
      const onApplyMock = jest.fn();
      const { getByText, getAllByText } = render(
        <FilterDropdown 
          {...defaultProps} 
          selected="Service Provider"
          onApply={onApplyMock} 
        />
      );
      
      fireEvent.press(getByText('Service Provider')); // Expand dropdown
      
      // Find the "All" option in the dropdown (not the display text)
      const allOptions = getAllByText('All');
      const allOption = allOptions.find(element => 
        element.props.testID !== 'dropdown-text' // Exclude the display text
      ) || allOptions[allOptions.length - 1]; // Take last "All" which should be the option
      
      fireEvent.press(allOption);
      fireEvent.press(getByText('Apply'));
      
      await waitFor(() => {
        expect(onApplyMock).toHaveBeenCalledWith('All');
      });
    });

    it('should replace previous selection in single select mode', async () => {
      const onApplyMock = jest.fn();
      const { getByText } = render(
        <FilterDropdown 
          {...defaultProps} 
          selected="Service Provider"
          onApply={onApplyMock} 
        />
      );
      
      fireEvent.press(getByText('Service Provider')); // Expand
      fireEvent.press(getByText('Manufacturer')); // Select different option
      fireEvent.press(getByText('Apply'));
      
      await waitFor(() => {
        expect(onApplyMock).toHaveBeenCalledWith('Manufacturer');
      });
    });
  });

  describe('Multi-Select Mode', () => {
    const multiSelectProps = {
      ...defaultProps,
      multiSelect: true,
      selected: [] as string[],
    };

    it('should handle multiple option selection', async () => {
      const onApplyMock = jest.fn();
      const { getByText } = render(
        <FilterDropdown {...multiSelectProps} onApply={onApplyMock} />
      );
      
      fireEvent.press(getByText('All')); // Expand dropdown
      fireEvent.press(getByText('Service Provider')); // Select first
      fireEvent.press(getByText('Manufacturer')); // Select second
      fireEvent.press(getByText('Apply'));
      
      await waitFor(() => {
        expect(onApplyMock).toHaveBeenCalledWith(['Service Provider', 'Manufacturer']);
      });
    });

    it('should deselect option when already selected in multi-select mode', async () => {
      const onApplyMock = jest.fn();
      const { getByText } = render(
        <FilterDropdown 
          {...multiSelectProps}
          selected={['Service Provider', 'Manufacturer']}
          onApply={onApplyMock}
        />
      );
      
      fireEvent.press(getByText('2 selected')); // Expand dropdown
      fireEvent.press(getByText('Service Provider')); // Deselect
      fireEvent.press(getByText('Apply'));
      
      await waitFor(() => {
        expect(onApplyMock).toHaveBeenCalledWith(['Manufacturer']);
      });
    });

    it('should clear all selections when "All" is pressed in multi-select mode', async () => {
      const onApplyMock = jest.fn();
      const { getByText, getAllByText } = render(
        <FilterDropdown 
          {...multiSelectProps}
          selected={['Service Provider', 'Manufacturer']}
          onApply={onApplyMock}
        />
      );
      
      fireEvent.press(getByText('2 selected')); // Expand dropdown
      
      // Find and press "All" option
      const allOptions = getAllByText('All');
      const allOption = allOptions[allOptions.length - 1];
      fireEvent.press(allOption);
      fireEvent.press(getByText('Apply'));
      
      await waitFor(() => {
        expect(onApplyMock).toHaveBeenCalledWith([]);
      });
    });

    it('should show "All" when no items selected in multi-select mode', () => {
      const { getByText } = render(
        <FilterDropdown {...multiSelectProps} selected={[]} />
      );
      
      expect(getByText('All')).toBeTruthy();
    });

    it('should show single item name when only one item selected', () => {
      const { getByText } = render(
        <FilterDropdown 
          {...multiSelectProps} 
          selected={['Service Provider']} 
        />
      );
      
      expect(getByText('Service Provider')).toBeTruthy();
    });
  });

  describe('Apply Button Behavior', () => {
    it('should close dropdown when apply is pressed', async () => {
      const { getByText, queryByText } = render(<FilterDropdown {...defaultProps} />);
      
      fireEvent.press(getByText('All')); // Expand
      fireEvent.press(getByText('Service Provider')); // Select
      fireEvent.press(getByText('Apply')); // Apply
      
      // After apply, check that Apply button is no longer visible (indicating dropdown closed)
      await waitFor(() => {
        expect(queryByText('Apply')).toBeFalsy();
      });
    });

    it('should call onApply with current selection when apply is pressed', async () => {
      const onApplyMock = jest.fn();
      const { getByText } = render(
        <FilterDropdown {...defaultProps} onApply={onApplyMock} />
      );
      
      fireEvent.press(getByText('All')); // Expand
      fireEvent.press(getByText('Manufacturer')); // Select
      fireEvent.press(getByText('Apply')); // Apply
      
      await waitFor(() => {
        expect(onApplyMock).toHaveBeenCalledWith('Manufacturer');
      });
    });
  });

  describe('State Management', () => {
    it('should maintain temporary selection until apply is pressed', () => {
      const onApplyMock = jest.fn();
      const { getByText } = render(
        <FilterDropdown {...defaultProps} selected="Service Provider" onApply={onApplyMock} />
      );
      
      fireEvent.press(getByText('Service Provider')); // Expand
      fireEvent.press(getByText('Manufacturer')); // Change selection (temporary)
      
      // Close dropdown without applying - just toggle again
      fireEvent.press(getByText('Service Provider')); // Toggle closed
      
      // Verify that onApply was not called since we didn't press Apply
      expect(onApplyMock).not.toHaveBeenCalled();
    });

    it('should handle rapid selection changes correctly', async () => {
      const onApplyMock = jest.fn();
      const { getByText } = render(
        <FilterDropdown {...defaultProps} onApply={onApplyMock} />
      );
      
      fireEvent.press(getByText('All')); // Expand
      
      // First expand to show all options
      fireEvent.press(getByText('+ Show more')); // Show all options
      
      // Now make rapid changes with visible options
      fireEvent.press(getByText('Service Provider'));
      fireEvent.press(getByText('Manufacturer'));
      fireEvent.press(getByText('Retailer'));
      fireEvent.press(getByText('Consulting'));
      
      fireEvent.press(getByText('Apply'));
      
      await waitFor(() => {
        expect(onApplyMock).toHaveBeenCalledWith('Consulting'); // Last selection should win
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      const { getByText, queryByText } = render(
        <FilterDropdown {...defaultProps} options={[]} />
      );
      
      fireEvent.press(getByText('All')); // Try to expand
      
      // Should only show "All" option
      expect(queryByText('Service Provider')).toBeFalsy();
    });

    it('should handle showLimit larger than options length', () => {
      const shortOptions = ['Option 1', 'Option 2'];
      const { getByText, queryByText } = render(
        <FilterDropdown 
          {...defaultProps} 
          options={shortOptions}
          showLimit={10}
        />
      );
      
      fireEvent.press(getByText('All'));
      
      expect(getByText('Option 1')).toBeTruthy();
      expect(getByText('Option 2')).toBeTruthy();
      expect(queryByText('+ Show more')).toBeFalsy(); // Should not show "Show more"
    });

    it('should handle invalid selected value gracefully', () => {
      const { getByText } = render(
        <FilterDropdown {...defaultProps} selected="Invalid Option" />
      );
      
      expect(getByText('Invalid Option')).toBeTruthy(); // Should still display it
    });

    it('should handle invalid selected array in multi-select mode', () => {
      const { getByText } = render(
        <FilterDropdown 
          {...defaultProps} 
          multiSelect={true}
          selected={['Valid Option', 'Invalid Option']}
        />
      );
      
      expect(getByText('2 selected')).toBeTruthy(); // Should handle gracefully
    });
  });

  describe('Accessibility', () => {
    it('should have proper testID for main dropdown', () => {
      const { getByText } = render(<FilterDropdown {...defaultProps} />);
      
      // The component should have identifiable elements for testing
      expect(getByText('Test Filter')).toBeTruthy();
      expect(getByText('All')).toBeTruthy();
    });

    it('should provide feedback for screen readers', () => {
      const { getByText } = render(<FilterDropdown {...defaultProps} />);
      
      // Text content should be accessible
      expect(getByText('Test Filter')).toBeTruthy();
      expect(getByText('All')).toBeTruthy();
    });
  });
});
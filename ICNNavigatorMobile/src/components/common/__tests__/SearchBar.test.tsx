import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import SearchBar from '../SearchBar';

describe('SearchBar Component', () => {
  const mockOnChangeText = jest.fn();
  const mockOnFilter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default placeholder', () => {
      render(<SearchBar value="" onChangeText={mockOnChangeText} />);
      
      expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
    });

    it('should render with custom placeholder', () => {
      render(
        <SearchBar 
          value="" 
          onChangeText={mockOnChangeText} 
          placeholder="Search companies..."
        />
      );
      
      expect(screen.getByPlaceholderText('Search companies...')).toBeTruthy();
    });

    it('should display current value', () => {
      render(<SearchBar value="ABC Company" onChangeText={mockOnChangeText} />);
      
      expect(screen.getByDisplayValue('ABC Company')).toBeTruthy();
    });

    it('should render filter button when onFilter is provided', () => {
      render(
        <SearchBar 
          value="" 
          onChangeText={mockOnChangeText} 
          onFilter={mockOnFilter}
        />
      );
      
      expect(screen.getByTestId('filter-button')).toBeTruthy();
    });

    it('should not render filter button when onFilter is not provided', () => {
      render(<SearchBar value="" onChangeText={mockOnChangeText} />);
      
      expect(screen.queryByTestId('filter-button')).toBeNull();
    });
  });

  describe('Interactive Behavior', () => {
    it('should call onChangeText when text input changes', () => {
      render(<SearchBar value="" onChangeText={mockOnChangeText} />);
      
      fireEvent.changeText(screen.getByTestId('search-input'), 'New Search');
      expect(mockOnChangeText).toHaveBeenCalledWith('New Search');
    });

    it('should call onFilter when filter button is pressed', () => {
      render(
        <SearchBar 
          value="" 
          onChangeText={mockOnChangeText} 
          onFilter={mockOnFilter}
        />
      );
      
      fireEvent.press(screen.getByTestId('filter-button'));
      expect(mockOnFilter).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple text changes', () => {
      render(<SearchBar value="" onChangeText={mockOnChangeText} />);
      
      fireEvent.changeText(screen.getByTestId('search-input'), 'First');
      fireEvent.changeText(screen.getByTestId('search-input'), 'Second');
      
      expect(mockOnChangeText).toHaveBeenCalledTimes(2);
      expect(mockOnChangeText).toHaveBeenNthCalledWith(1, 'First');
      expect(mockOnChangeText).toHaveBeenNthCalledWith(2, 'Second');
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(
        <SearchBar 
          value="" 
          onChangeText={mockOnChangeText} 
          onFilter={mockOnFilter}
        />
      );
      
      expect(screen.getByLabelText('Search input')).toBeTruthy();
      expect(screen.getByLabelText('Filter companies')).toBeTruthy();
    });

    it('should have testID for search input', () => {
      render(<SearchBar value="" onChangeText={mockOnChangeText} />);
      
      expect(screen.getByTestId('search-input')).toBeTruthy();
    });
  });

  describe('Props Validation', () => {
    it('should handle empty string value', () => {
      render(<SearchBar value="" onChangeText={mockOnChangeText} />);
      
      expect(screen.getByDisplayValue('')).toBeTruthy();
    });

    it('should handle special characters in search', () => {
      render(<SearchBar value="@#$%^&*()" onChangeText={mockOnChangeText} />);
      
      expect(screen.getByDisplayValue('@#$%^&*()')).toBeTruthy();
    });

    it('should handle long search text', () => {
      const longText = 'This is a very long search text that should be handled properly without breaking';
      render(<SearchBar value={longText} onChangeText={mockOnChangeText} />);
      
      expect(screen.getByDisplayValue(longText)).toBeTruthy();
    });
  });
});
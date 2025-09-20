import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import CompanyCard from '../CompanyCard';
import { Company } from '../../../types';

describe('CompanyCard Component', () => {
  const mockCompany: Company = {
    id: '1',
    name: 'Test Company',
    address: '123 Test Street, Melbourne, VIC 3000',
    verificationStatus: 'verified',
    verificationDate: '2025-01-07',
    keySectors: ['Supplier', 'Manufacturing'],
    latitude: -37.8136,
    longitude: 144.9631,
  };

  const mockOnPress = jest.fn();
  const mockOnBookmark = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render company name and address', () => {
      render(<CompanyCard company={mockCompany} onPress={mockOnPress} />);
      
      expect(screen.getByText('Test Company')).toBeTruthy();
      expect(screen.getByText('123 Test Street, Melbourne, VIC 3000')).toBeTruthy();
    });

    it('should render first letter of company name as avatar', () => {
      render(<CompanyCard company={mockCompany} onPress={mockOnPress} />);
      
      expect(screen.getByText('T')).toBeTruthy(); // First letter of "Test Company"
    });

    it('should show verified badge for verified companies', () => {
      render(<CompanyCard company={mockCompany} onPress={mockOnPress} />);
      
      expect(screen.getByText(/Verified on/)).toBeTruthy();
      expect(screen.getByText(/2025-01-07/)).toBeTruthy();
    });

    it('should not show verified badge for unverified companies', () => {
      const unverifiedCompany = { ...mockCompany, verificationStatus: 'unverified' as const };
      render(<CompanyCard company={unverifiedCompany} onPress={mockOnPress} />);
      
      expect(screen.queryByText(/Verified on/)).toBeNull();
    });

    it('should handle missing verification date gracefully', () => {
      const companyWithoutDate = { ...mockCompany, verificationDate: undefined };
      render(<CompanyCard company={companyWithoutDate} onPress={mockOnPress} />);
      
      expect(screen.getByText(/Verified on.*1\/07\/2025/)).toBeTruthy(); // Default date
    });
  });

  describe('Interactive Behavior', () => {
    it('should call onPress when card is pressed', () => {
      render(<CompanyCard company={mockCompany} onPress={mockOnPress} />);
      
      fireEvent.press(screen.getByTestId('company-card'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should render bookmark button when onBookmark is provided', () => {
      render(
        <CompanyCard 
          company={mockCompany} 
          onPress={mockOnPress} 
          onBookmark={mockOnBookmark}
          isBookmarked={false}
        />
      );
      
      expect(screen.getByTestId('bookmark-button')).toBeTruthy();
    });

    it('should call onBookmark when bookmark button is pressed', () => {
      render(
        <CompanyCard 
          company={mockCompany} 
          onPress={mockOnPress} 
          onBookmark={mockOnBookmark}
          isBookmarked={false}
        />
      );
      
      fireEvent.press(screen.getByTestId('bookmark-button'));
      expect(mockOnBookmark).toHaveBeenCalledTimes(1);
    });

    it('should show filled bookmark icon when isBookmarked is true', () => {
      render(
        <CompanyCard 
          company={mockCompany} 
          onPress={mockOnPress} 
          onBookmark={mockOnBookmark}
          isBookmarked={true}
        />
      );
      
      expect(screen.getByTestId('bookmark-icon-filled')).toBeTruthy();
    });

    it('should show outline bookmark icon when isBookmarked is false', () => {
      render(
        <CompanyCard 
          company={mockCompany} 
          onPress={mockOnPress} 
          onBookmark={mockOnBookmark}
          isBookmarked={false}
        />
      );
      
      expect(screen.getByTestId('bookmark-icon-outline')).toBeTruthy();
    });
  });

  describe('Conditional Rendering', () => {
    it('should not render bookmark button when onBookmark is not provided', () => {
      render(<CompanyCard company={mockCompany} onPress={mockOnPress} />);
      
      expect(screen.queryByTestId('bookmark-button')).toBeNull();
    });

    it('should render sectors when provided', () => {
      render(<CompanyCard company={mockCompany} onPress={mockOnPress} />);
      
      // Check if sectors are rendered (this depends on the actual CompanyCard implementation)
      expect(screen.getByText(/Supplier/)).toBeTruthy();
      expect(screen.getByText(/Manufacturing/)).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle company with empty name gracefully', () => {
      const companyWithEmptyName = { ...mockCompany, name: '' };
      render(<CompanyCard company={companyWithEmptyName} onPress={mockOnPress} />);
      
      // Should still render without crashing
      expect(screen.getByTestId('company-card')).toBeTruthy();
    });

    it('should handle company with long name', () => {
      const companyWithLongName = {
        ...mockCompany,
        name: 'Very Long Company Name That Should Be Truncated Properly'
      };
      render(<CompanyCard company={companyWithLongName} onPress={mockOnPress} />);
      
      expect(screen.getByText('Very Long Company Name That Should Be Truncated Properly')).toBeTruthy();
    });
  });
});
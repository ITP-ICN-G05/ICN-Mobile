import { renderHook, act } from '@testing-library/react-native';
import { useCompanySearch } from '../useCompanySearch';
import { Company } from '../../types';

describe('useCompanySearch Hook', () => {
  const mockCompanies: Company[] = [
    {
      id: '1',
      name: 'ABC Construction Ltd',
      address: '123 Smith Street, Melbourne',
      verificationStatus: 'verified',
      keySectors: ['Construction'],
      latitude: -37.8136,
      longitude: 144.9631,
    },
    {
      id: '2',
      name: 'XYZ Engineering',
      address: '456 Collins Street, Melbourne',
      verificationStatus: 'unverified',
      keySectors: ['Engineering'],
      latitude: -37.8140,
      longitude: 144.9633,
    },
    {
      id: '3',
      name: 'Melbourne Consulting',
      address: '789 Bourke Street, Melbourne',
      verificationStatus: 'verified',
      keySectors: ['Consulting', 'Engineering'],
      latitude: -37.8150,
      longitude: 144.9640,
    }
  ];

  describe('Initial State', () => {
    it('should initialize with empty search and all companies', () => {
      const { result } = renderHook(() => useCompanySearch(mockCompanies));
      
      expect(result.current.searchText).toBe('');
      expect(result.current.filteredCompanies).toHaveLength(3);
      expect(result.current.filters.capabilities).toEqual([]);
      expect(result.current.filters.verificationStatus).toBe('all');
    });
  });

  describe('Search Text Filtering', () => {
    it('should filter companies when search text changes', () => {
      const { result } = renderHook(() => useCompanySearch(mockCompanies));
      
      act(() => {
        result.current.setSearchText('ABC');
      });
      
      expect(result.current.searchText).toBe('ABC');
      expect(result.current.filteredCompanies).toHaveLength(1);
      expect(result.current.filteredCompanies[0].name).toBe('ABC Construction Ltd');
    });

    it('should filter companies by address', () => {
      const { result } = renderHook(() => useCompanySearch(mockCompanies));
      
      act(() => {
        result.current.setSearchText('Collins');
      });
      
      expect(result.current.filteredCompanies).toHaveLength(1);
      expect(result.current.filteredCompanies[0].address).toContain('Collins Street');
    });

    it('should filter companies by sectors', () => {
      const { result } = renderHook(() => useCompanySearch(mockCompanies));
      
      act(() => {
        result.current.setSearchText('Engineering');
      });
      
      expect(result.current.filteredCompanies).toHaveLength(2); // XYZ Engineering and Melbourne Consulting
    });

    it('should return all companies for empty search', () => {
      const { result } = renderHook(() => useCompanySearch(mockCompanies));
      
      act(() => {
        result.current.setSearchText('ABC');
      });
      
      expect(result.current.filteredCompanies).toHaveLength(1);
      
      act(() => {
        result.current.setSearchText('');
      });
      
      expect(result.current.filteredCompanies).toHaveLength(3);
    });
  });

  describe('Filter Application', () => {
    it('should apply verification status filters correctly', () => {
      const { result } = renderHook(() => useCompanySearch(mockCompanies));
      
      act(() => {
        result.current.setFilters({
          capabilities: [],
          distance: 'All',
          verificationStatus: 'verified'
        });
      });
      
      expect(result.current.filteredCompanies).toHaveLength(2); // ABC Construction and Melbourne Consulting
      result.current.filteredCompanies.forEach(company => {
        expect(company.verificationStatus).toBe('verified');
      });
    });

    it('should apply capability filters correctly', () => {
      const { result } = renderHook(() => useCompanySearch(mockCompanies));
      
      act(() => {
        result.current.setFilters({
          capabilities: ['Construction'],
          distance: 'All',
          verificationStatus: 'all'
        });
      });
      
      expect(result.current.filteredCompanies).toHaveLength(1);
      expect(result.current.filteredCompanies[0].name).toBe('ABC Construction Ltd');
    });

    it('should handle multiple capability filters', () => {
      const { result } = renderHook(() => useCompanySearch(mockCompanies));
      
      act(() => {
        result.current.setFilters({
          capabilities: ['Engineering', 'Consulting'],
          distance: 'All',
          verificationStatus: 'all'
        });
      });
      
      expect(result.current.filteredCompanies).toHaveLength(2); // XYZ Engineering and Melbourne Consulting
    });
  });

  describe('Combined Search and Filters', () => {
    it('should combine search text and filters', () => {
      const { result } = renderHook(() => useCompanySearch(mockCompanies));
      
      act(() => {
        result.current.setSearchText('Engineering');
        result.current.setFilters({
          capabilities: [],
          distance: 'All',
          verificationStatus: 'unverified'
        });
      });
      
      expect(result.current.filteredCompanies).toHaveLength(1);
      expect(result.current.filteredCompanies[0].name).toBe('XYZ Engineering');
    });

    it('should return empty results when search and filter have no matches', () => {
      const { result } = renderHook(() => useCompanySearch(mockCompanies));
      
      act(() => {
        result.current.setSearchText('NonExistentCompany');
        result.current.setFilters({
          capabilities: ['Construction'],
          distance: 'All',
          verificationStatus: 'verified'
        });
      });
      
      expect(result.current.filteredCompanies).toHaveLength(0);
    });

    it('should update filters without affecting search text', () => {
      const { result } = renderHook(() => useCompanySearch(mockCompanies));
      
      act(() => {
        result.current.setSearchText('Melbourne');
      });
      
      expect(result.current.searchText).toBe('Melbourne');
      
      act(() => {
        result.current.setFilters({
          capabilities: ['Consulting'],
          distance: 'All',
          verificationStatus: 'all'
        });
      });
      
      expect(result.current.searchText).toBe('Melbourne'); // Should remain unchanged
      expect(result.current.filteredCompanies).toHaveLength(1);
      expect(result.current.filteredCompanies[0].name).toBe('Melbourne Consulting');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty companies array', () => {
      const { result } = renderHook(() => useCompanySearch([]));
      
      expect(result.current.filteredCompanies).toHaveLength(0);
      
      act(() => {
        result.current.setSearchText('test');
      });
      
      expect(result.current.filteredCompanies).toHaveLength(0);
    });

    it('should handle case-insensitive capability matching', () => {
      const { result } = renderHook(() => useCompanySearch(mockCompanies));
      
      act(() => {
        result.current.setFilters({
          capabilities: ['construction'], // lowercase
          distance: 'All',
          verificationStatus: 'all'
        });
      });
      
      expect(result.current.filteredCompanies).toHaveLength(1);
      expect(result.current.filteredCompanies[0].name).toBe('ABC Construction Ltd');
    });
  });
});
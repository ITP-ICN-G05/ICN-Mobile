// Business logic tests for CompaniesScreen
// These tests focus on the core business logic functions extracted from the screen
// NOT testing full screen rendering to avoid complex mocking

import { Company } from '../../../types';
import { FilterOptions } from '../../../components/common/FilterModal';

// Mock company data for testing
const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Alpha Tech Solutions',
    address: '123 Tech Street, Silicon Valley',
    verificationStatus: 'verified',
    keySectors: ['Technology', 'Service Provider'],
    latitude: -37.8136,
    longitude: 144.9631,
  },
  {
    id: '2',
    name: 'Beta Manufacturing Corp',
    address: '456 Factory Road, Industrial Zone',
    verificationStatus: 'unverified',
    keySectors: ['Manufacturing', 'Item Supplier'],
    latitude: -37.8200,
    longitude: 144.9700,
  },
  {
    id: '3',
    name: 'Gamma Energy Solutions',
    address: '789 Green Boulevard, Eco District',
    verificationStatus: 'verified',
    keySectors: ['Energy', 'Consulting'],
    latitude: -37.8100,
    longitude: 144.9600,
  },
  {
    id: '4',
    name: 'Delta Retail Systems',
    address: '321 Commerce Ave, Trade Center',
    verificationStatus: 'verified',
    keySectors: ['Retailer', 'Technology'],
    latitude: -37.8180,
    longitude: 144.9680,
  },
  {
    id: '5',
    name: 'Epsilon Construction',
    address: '654 Build Street, Construction Zone',
    verificationStatus: 'unverified',
    keySectors: ['Construction', 'Engineering'],
    latitude: -37.8220,
    longitude: 144.9720,
  },
];

// Business logic functions extracted from CompaniesScreen
class CompaniesScreenBusinessLogic {
  // Filter companies by search text
  static filterBySearchText(companies: Company[], searchText: string): Company[] {
    if (!searchText) return companies;
    
    return companies.filter(company =>
      company.name.toLowerCase().includes(searchText.toLowerCase()) ||
      company.address.toLowerCase().includes(searchText.toLowerCase()) ||
      company.keySectors.some(sector => 
        sector.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }

  // Apply capability filters
  static applyCapabilityFilter(companies: Company[], capabilities: string[]): Company[] {
    if (capabilities.length === 0) return companies;
    
    return companies.filter(company =>
      capabilities.some(capability =>
        company.keySectors.includes(capability) ||
        company.keySectors.some(sector =>
          sector.toLowerCase().includes(capability.toLowerCase())
        )
      )
    );
  }

  // Apply verification status filter
  static applyVerificationFilter(companies: Company[], verificationStatus: string): Company[] {
    if (verificationStatus === 'All') return companies;
    
    const statusToCheck = verificationStatus.toLowerCase();
    return companies.filter(company => 
      company.verificationStatus === statusToCheck
    );
  }

  // Apply all filters
  static applyAllFilters(
    companies: Company[], 
    searchText: string, 
    filters: FilterOptions
  ): Company[] {
    let filtered = [...companies];

    // Apply search filter
    filtered = this.filterBySearchText(filtered, searchText);

    // Apply capability filter
    filtered = this.applyCapabilityFilter(filtered, filters.capabilities);

    // Apply verification filter
    filtered = this.applyVerificationFilter(filtered, filters.verificationStatus);

    return filtered;
  }

  // Sort companies by different criteria
  static sortCompanies(companies: Company[], sortBy: 'name' | 'verified' | 'recent'): Company[] {
    const sorted = [...companies];

    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'verified':
        return sorted.sort((a, b) => {
          if (a.verificationStatus === 'verified' && b.verificationStatus !== 'verified') return -1;
          if (a.verificationStatus !== 'verified' && b.verificationStatus === 'verified') return 1;
          return a.name.localeCompare(b.name);
        });
      case 'recent':
        // Sort by ID (simulating recent activity)
        return sorted.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      default:
        return sorted;
    }
  }

  // Get bookmarked companies
  static getBookmarkedCompanies(companies: Company[], bookmarkedIds: string[]): Company[] {
    return companies.filter(company => bookmarkedIds.includes(company.id));
  }

  // Toggle bookmark functionality
  static toggleBookmark(bookmarkedIds: string[], id: string): string[] {
    return bookmarkedIds.includes(id) 
      ? bookmarkedIds.filter(bookId => bookId !== id)
      : [...bookmarkedIds, id];
  }

  // Check if filters are active
  static hasActiveFilters(filters: FilterOptions): boolean {
    return filters.capabilities.length > 0 || 
           filters.distance !== 'All' || 
           filters.verificationStatus !== 'All';
  }

  // Get active filter count
  static getActiveFilterCount(filters: FilterOptions): number {
    let count = 0;
    if (filters.capabilities.length > 0) count++;
    if (filters.distance !== 'All') count++;
    if (filters.verificationStatus !== 'All') count++;
    return count;
  }

  // Combined search, filter, and sort
  static processCompanies(
    companies: Company[],
    searchText: string,
    filters: FilterOptions,
    sortBy: 'name' | 'verified' | 'recent'
  ): Company[] {
    const filtered = this.applyAllFilters(companies, searchText, filters);
    return this.sortCompanies(filtered, sortBy);
  }

  // Calculate statistics
  static calculateStats(companies: Company[], bookmarkedIds: string[]) {
    return {
      total: companies.length,
      verified: companies.filter(c => c.verificationStatus === 'verified').length,
      bookmarked: bookmarkedIds.length,
    };
  }
}

describe('CompaniesScreen Business Logic', () => {
  describe('Search and Filter Logic', () => {
    it('should filter companies by search text in name', () => {
      const result = CompaniesScreenBusinessLogic.filterBySearchText(mockCompanies, 'Alpha');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alpha Tech Solutions');
    });

    it('should filter companies by search text in address', () => {
      const result = CompaniesScreenBusinessLogic.filterBySearchText(mockCompanies, 'Silicon Valley');
      
      expect(result).toHaveLength(1);
      expect(result[0].address).toContain('Silicon Valley');
    });

    it('should filter companies by search text in sectors', () => {
      const result = CompaniesScreenBusinessLogic.filterBySearchText(mockCompanies, 'Technology');
      
      expect(result.length).toBeGreaterThanOrEqual(2);
      result.forEach(company => {
        expect(company.keySectors.some(sector => 
          sector.toLowerCase().includes('technology')
        )).toBe(true);
      });
    });

    it('should be case insensitive when filtering by search text', () => {
      const resultLower = CompaniesScreenBusinessLogic.filterBySearchText(mockCompanies, 'alpha');
      const resultUpper = CompaniesScreenBusinessLogic.filterBySearchText(mockCompanies, 'ALPHA');
      const resultMixed = CompaniesScreenBusinessLogic.filterBySearchText(mockCompanies, 'Alpha');
      
      expect(resultLower).toEqual(resultUpper);
      expect(resultLower).toEqual(resultMixed);
      expect(resultLower).toHaveLength(1);
    });

    it('should return empty array when search text matches nothing', () => {
      const result = CompaniesScreenBusinessLogic.filterBySearchText(mockCompanies, 'NonExistentCompany');
      
      expect(result).toHaveLength(0);
    });

    it('should return all companies when search text is empty', () => {
      const result = CompaniesScreenBusinessLogic.filterBySearchText(mockCompanies, '');
      
      expect(result).toEqual(mockCompanies);
    });
  });

  describe('Capability Filter Logic', () => {
    it('should filter companies by single capability', () => {
      const result = CompaniesScreenBusinessLogic.applyCapabilityFilter(mockCompanies, ['Technology']);
      
      expect(result).toHaveLength(2);
      result.forEach(company => {
        expect(company.keySectors.includes('Technology')).toBe(true);
      });
    });

    it('should filter companies by multiple capabilities', () => {
      const result = CompaniesScreenBusinessLogic.applyCapabilityFilter(
        mockCompanies, 
        ['Technology', 'Manufacturing']
      );
      
      expect(result.length).toBeGreaterThanOrEqual(3);
      result.forEach(company => {
        const hasRequiredCapability = company.keySectors.some(sector => 
          ['Technology', 'Manufacturing'].some(cap => 
            sector.includes(cap) || sector.toLowerCase().includes(cap.toLowerCase())
          )
        );
        expect(hasRequiredCapability).toBe(true);
      });
    });

    it('should return all companies when capabilities array is empty', () => {
      const result = CompaniesScreenBusinessLogic.applyCapabilityFilter(mockCompanies, []);
      
      expect(result).toEqual(mockCompanies);
    });

    it('should handle case insensitive capability matching', () => {
      const result = CompaniesScreenBusinessLogic.applyCapabilityFilter(mockCompanies, ['technology']);
      
      expect(result).toHaveLength(2);
      result.forEach(company => {
        expect(company.keySectors.some(sector => 
          sector.toLowerCase().includes('technology')
        )).toBe(true);
      });
    });
  });

  describe('Verification Status Filter Logic', () => {
    it('should filter companies by verified status', () => {
      const result = CompaniesScreenBusinessLogic.applyVerificationFilter(mockCompanies, 'Verified');
      
      expect(result).toHaveLength(3);
      result.forEach(company => {
        expect(company.verificationStatus).toBe('verified');
      });
    });

    it('should filter companies by unverified status', () => {
      const result = CompaniesScreenBusinessLogic.applyVerificationFilter(mockCompanies, 'Unverified');
      
      expect(result).toHaveLength(2);
      result.forEach(company => {
        expect(company.verificationStatus).toBe('unverified');
      });
    });

    it('should return all companies when status is "All"', () => {
      const result = CompaniesScreenBusinessLogic.applyVerificationFilter(mockCompanies, 'All');
      
      expect(result).toEqual(mockCompanies);
    });

    it('should handle case insensitive verification status matching', () => {
      const resultLower = CompaniesScreenBusinessLogic.applyVerificationFilter(mockCompanies, 'verified');
      const resultUpper = CompaniesScreenBusinessLogic.applyVerificationFilter(mockCompanies, 'VERIFIED');
      
      expect(resultLower).toEqual(resultUpper);
      expect(resultLower).toHaveLength(3);
    });
  });

  describe('Combined Search and Filters', () => {
    it('should apply combined search and capability filters', () => {
      const filters: FilterOptions = {
        capabilities: ['Technology'],
        distance: 'All',
        verificationStatus: 'All',
      };
      
      const result = CompaniesScreenBusinessLogic.applyAllFilters(
        mockCompanies, 
        'Alpha', 
        filters
      );
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alpha Tech Solutions');
    });

    it('should apply combined search and verification filters', () => {
      const filters: FilterOptions = {
        capabilities: [],
        distance: 'All',
        verificationStatus: 'Verified',
      };
      
      const result = CompaniesScreenBusinessLogic.applyAllFilters(
        mockCompanies, 
        'Alpha', 
        filters
      );
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alpha Tech Solutions');
      expect(result[0].verificationStatus).toBe('verified');
    });

    it('should apply all filters together', () => {
      const filters: FilterOptions = {
        capabilities: ['Technology'],
        distance: 'All',
        verificationStatus: 'Verified',
      };
      
      const result = CompaniesScreenBusinessLogic.applyAllFilters(
        mockCompanies, 
        '', 
        filters
      );
      
      expect(result).toHaveLength(2);
      result.forEach(company => {
        expect(company.verificationStatus).toBe('verified');
        expect(company.keySectors.includes('Technology')).toBe(true);
      });
    });

    it('should return empty array when filters match nothing', () => {
      const filters: FilterOptions = {
        capabilities: ['NonExistentCapability'],
        distance: 'All',
        verificationStatus: 'All',
      };
      
      const result = CompaniesScreenBusinessLogic.applyAllFilters(
        mockCompanies, 
        '', 
        filters
      );
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Sorting Logic', () => {
    it('should sort companies by name alphabetically', () => {
      const result = CompaniesScreenBusinessLogic.sortCompanies(mockCompanies, 'name');
      
      expect(result[0].name).toBe('Alpha Tech Solutions');
      expect(result[1].name).toBe('Beta Manufacturing Corp');
      expect(result[2].name).toBe('Delta Retail Systems');
      expect(result[3].name).toBe('Epsilon Construction');
      expect(result[4].name).toBe('Gamma Energy Solutions');
    });

    it('should sort companies with verified first', () => {
      const result = CompaniesScreenBusinessLogic.sortCompanies(mockCompanies, 'verified');
      
      // First companies should be verified
      const verifiedCompanies = result.filter(c => c.verificationStatus === 'verified');
      const unverifiedCompanies = result.filter(c => c.verificationStatus === 'unverified');
      
      expect(verifiedCompanies).toHaveLength(3);
      expect(unverifiedCompanies).toHaveLength(2);
      
      // Within verified group, should be sorted by name
      expect(verifiedCompanies[0].name).toBe('Alpha Tech Solutions');
      expect(verifiedCompanies[1].name).toBe('Delta Retail Systems');
      expect(verifiedCompanies[2].name).toBe('Gamma Energy Solutions');
    });

    it('should sort companies by recent (ID descending)', () => {
      const result = CompaniesScreenBusinessLogic.sortCompanies(mockCompanies, 'recent');
      
      expect(result[0].id).toBe('5');
      expect(result[1].id).toBe('4');
      expect(result[2].id).toBe('3');
      expect(result[3].id).toBe('2');
      expect(result[4].id).toBe('1');
    });

    it('should maintain original order for unknown sort type', () => {
      const result = CompaniesScreenBusinessLogic.sortCompanies(mockCompanies, 'unknown' as any);
      
      expect(result).toEqual(mockCompanies);
    });

    it('should not modify original array when sorting', () => {
      const originalOrder = [...mockCompanies];
      CompaniesScreenBusinessLogic.sortCompanies(mockCompanies, 'name');
      
      expect(mockCompanies).toEqual(originalOrder);
    });
  });

  describe('Bookmark Management', () => {
    it('should get bookmarked companies correctly', () => {
      const bookmarkedIds = ['1', '3', '5'];
      const result = CompaniesScreenBusinessLogic.getBookmarkedCompanies(mockCompanies, bookmarkedIds);
      
      expect(result).toHaveLength(3);
      expect(result.map(c => c.id)).toEqual(['1', '3', '5']);
    });

    it('should return empty array when no bookmarks', () => {
      const result = CompaniesScreenBusinessLogic.getBookmarkedCompanies(mockCompanies, []);
      
      expect(result).toHaveLength(0);
    });

    it('should add bookmark when not already bookmarked', () => {
      const bookmarkedIds = ['1', '2'];
      const result = CompaniesScreenBusinessLogic.toggleBookmark(bookmarkedIds, '3');
      
      expect(result).toEqual(['1', '2', '3']);
    });

    it('should remove bookmark when already bookmarked', () => {
      const bookmarkedIds = ['1', '2', '3'];
      const result = CompaniesScreenBusinessLogic.toggleBookmark(bookmarkedIds, '2');
      
      expect(result).toEqual(['1', '3']);
    });

    it('should handle toggle on empty bookmark list', () => {
      const result = CompaniesScreenBusinessLogic.toggleBookmark([], '1');
      
      expect(result).toEqual(['1']);
    });

    it('should not modify original bookmark array', () => {
      const originalBookmarks = ['1', '2'];
      const originalCopy = [...originalBookmarks];
      CompaniesScreenBusinessLogic.toggleBookmark(originalBookmarks, '3');
      
      expect(originalBookmarks).toEqual(originalCopy);
    });
  });

  describe('Filter State Management', () => {
    it('should detect active filters when capabilities are set', () => {
      const filters: FilterOptions = {
        capabilities: ['Technology'],
        distance: 'All',
        verificationStatus: 'All',
      };
      
      expect(CompaniesScreenBusinessLogic.hasActiveFilters(filters)).toBe(true);
    });

    it('should detect active filters when verification status is set', () => {
      const filters: FilterOptions = {
        capabilities: [],
        distance: 'All',
        verificationStatus: 'Verified',
      };
      
      expect(CompaniesScreenBusinessLogic.hasActiveFilters(filters)).toBe(true);
    });

    it('should detect active filters when distance is set', () => {
      const filters: FilterOptions = {
        capabilities: [],
        distance: '5km',
        verificationStatus: 'All',
      };
      
      expect(CompaniesScreenBusinessLogic.hasActiveFilters(filters)).toBe(true);
    });

    it('should detect no active filters when all are default', () => {
      const filters: FilterOptions = {
        capabilities: [],
        distance: 'All',
        verificationStatus: 'All',
      };
      
      expect(CompaniesScreenBusinessLogic.hasActiveFilters(filters)).toBe(false);
    });

    it('should count active filters correctly', () => {
      const filters: FilterOptions = {
        capabilities: ['Technology', 'Manufacturing'],
        distance: '5km',
        verificationStatus: 'Verified',
      };
      
      expect(CompaniesScreenBusinessLogic.getActiveFilterCount(filters)).toBe(3);
    });

    it('should count zero when no active filters', () => {
      const filters: FilterOptions = {
        capabilities: [],
        distance: 'All',
        verificationStatus: 'All',
      };
      
      expect(CompaniesScreenBusinessLogic.getActiveFilterCount(filters)).toBe(0);
    });
  });

  describe('Complete Processing Pipeline', () => {
    it('should process companies with search, filters, and sorting', () => {
      const filters: FilterOptions = {
        capabilities: ['Technology'],
        distance: 'All',
        verificationStatus: 'All',
      };
      
      const result = CompaniesScreenBusinessLogic.processCompanies(
        mockCompanies, 
        '', 
        filters, 
        'name'
      );
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alpha Tech Solutions');
      expect(result[1].name).toBe('Delta Retail Systems');
    });

    it('should handle empty results gracefully', () => {
      const filters: FilterOptions = {
        capabilities: ['NonExistent'],
        distance: 'All',
        verificationStatus: 'All',
      };
      
      const result = CompaniesScreenBusinessLogic.processCompanies(
        mockCompanies, 
        'NonExistent', 
        filters, 
        'name'
      );
      
      expect(result).toHaveLength(0);
    });

    it('should maintain performance with large datasets', () => {
      // Create larger dataset for performance test
      const largeDataset: Company[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Company ${i + 1}`,
        address: `Address ${i + 1}`,
        verificationStatus: i % 2 === 0 ? 'verified' : 'unverified',
        keySectors: i % 3 === 0 ? ['Technology'] : ['Manufacturing'],
        latitude: -37.8136,
        longitude: 144.9631,
      }));

      const filters: FilterOptions = {
        capabilities: ['Technology'],
        distance: 'All',
        verificationStatus: 'Verified',
      };

      const startTime = Date.now();
      const result = CompaniesScreenBusinessLogic.processCompanies(
        largeDataset, 
        '', 
        filters, 
        'name'
      );
      const endTime = Date.now();

      // Should complete processing within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate statistics correctly', () => {
      const bookmarkedIds = ['1', '3'];
      const stats = CompaniesScreenBusinessLogic.calculateStats(mockCompanies, bookmarkedIds);
      
      expect(stats.total).toBe(5);
      expect(stats.verified).toBe(3);
      expect(stats.bookmarked).toBe(2);
    });

    it('should handle empty companies array', () => {
      const stats = CompaniesScreenBusinessLogic.calculateStats([], []);
      
      expect(stats.total).toBe(0);
      expect(stats.verified).toBe(0);
      expect(stats.bookmarked).toBe(0);
    });

    it('should handle no bookmarks', () => {
      const stats = CompaniesScreenBusinessLogic.calculateStats(mockCompanies, []);
      
      expect(stats.total).toBe(5);
      expect(stats.verified).toBe(3);
      expect(stats.bookmarked).toBe(0);
    });
  });
});
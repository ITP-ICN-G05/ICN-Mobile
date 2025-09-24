import { useState, useEffect, useCallback } from 'react';
import { Company, SearchFilters } from '../types';
import icnDataService from '../services/icnDataService';

export interface UseICNDataResult {
  companies: Company[];
  loading: boolean;
  error: string | null;
  searchResults: Company[];
  statistics: ReturnType<typeof icnDataService.getStatistics> | null;
  filterOptions: ReturnType<typeof icnDataService.getFilterOptions> | null;
  search: (searchText: string) => void;
  applyFilters: (filters: Partial<SearchFilters>) => void;
  getCompanyById: (id: string) => Company | undefined;
  refresh: () => Promise<void>;
}

export function useICNData(autoLoad: boolean = true): UseICNDataResult {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<ReturnType<typeof icnDataService.getStatistics> | null>(null);
  const [filterOptions, setFilterOptions] = useState<ReturnType<typeof icnDataService.getFilterOptions> | null>(null);
  const [currentFilters, setCurrentFilters] = useState<Partial<SearchFilters>>({});

  // Load data from JSON file
  const loadData = useCallback(async (forceReload: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (forceReload) {
        icnDataService.clearCache();
      }
      
      await icnDataService.loadData();
      
      const loadedCompanies = icnDataService.getCompanies();
      setCompanies(loadedCompanies);
      setSearchResults(loadedCompanies); // Initially show all companies
      setStatistics(icnDataService.getStatistics());
      setFilterOptions(icnDataService.getFilterOptions());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load ICN data';
      setError(errorMessage);
      console.error('Error loading ICN data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  // Search function
  const search = useCallback((searchText: string) => {
    if (!searchText.trim()) {
      setSearchResults(companies);
      setCurrentFilters(prev => ({ ...prev, searchText: '' }));
      return;
    }
    
    const results = icnDataService.searchCompanies(searchText);
    setSearchResults(results);
    setCurrentFilters(prev => ({ ...prev, searchText }));
  }, [companies]);

  // Apply filters
  const applyFilters = useCallback((filters: Partial<SearchFilters>) => {
    let filtered = [...companies];
    
    // Text search
    if (filters.searchText) {
      filtered = icnDataService.searchCompanies(filters.searchText);
    }
    
    // State filter
    if (filters.state) {
      filtered = filtered.filter(company => 
        company.billingAddress?.state === filters.state
      );
    }
    
    // Company type filter
    if (filters.companyTypes && filters.companyTypes.length > 0) {
      filtered = filtered.filter(company =>
        filters.companyTypes!.includes(company.companyType!)
      );
    }
    
    // Sectors filter
    if (filters.sectors && filters.sectors.length > 0) {
      filtered = filtered.filter(company =>
        company.keySectors.some(sector => filters.sectors!.includes(sector))
      );
    }
    
    // Verification status filter
    if (filters.verificationStatus && filters.verificationStatus !== 'all') {
      filtered = filtered.filter(company =>
        company.verificationStatus === filters.verificationStatus
      );
    }
    
    // Distance filter (if coordinates provided)
    if (filters.latitude && filters.longitude && filters.distance) {
      filtered = filtered.filter(company => {
        const distance = calculateDistance(
          filters.latitude!,
          filters.longitude!,
          company.latitude,
          company.longitude
        );
        return distance <= filters.distance!;
      });
    }
    
    // Sort
    if (filters.sortBy) {
      filtered = sortCompanies(filtered, filters.sortBy, filters.sortOrder);
    }
    
    setSearchResults(filtered);
    setCurrentFilters(filters);
  }, [companies]);

  // Get company by ID
  const getCompanyById = useCallback((id: string): Company | undefined => {
    return icnDataService.getCompanyById(id);
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  return {
    companies,
    loading,
    error,
    searchResults,
    statistics,
    filterOptions,
    search,
    applyFilters,
    getCompanyById,
    refresh
  };
}

// Helper function to calculate distance between coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to sort companies
function sortCompanies(
  companies: Company[],
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): Company[] {
  const sorted = [...companies];
  
  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'verified':
      sorted.sort((a, b) => {
        if (a.verificationStatus === 'verified' && b.verificationStatus !== 'verified') return -1;
        if (a.verificationStatus !== 'verified' && b.verificationStatus === 'verified') return 1;
        return 0;
      });
      break;
    case 'distance':
      // Distance sorting requires coordinates context, skip for now
      break;
    case 'rating':
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    default:
      // relevance - keep original order
      break;
  }
  
  if (sortOrder === 'desc') {
    sorted.reverse();
  }
  
  return sorted;
}

// React Native specific hook with AsyncStorage caching
export function useICNDataNative() {
  // You can add React Native specific features here
  // like AsyncStorage caching, NetInfo for offline handling, etc.
  return useICNData();
}

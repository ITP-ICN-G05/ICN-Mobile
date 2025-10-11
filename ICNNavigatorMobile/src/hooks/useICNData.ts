import { useState, useEffect, useCallback } from 'react';
import { Company, SearchFilters } from '../types';
import { organisationApiService, OrganisationCard, Organisation } from '../services/organisationApiService';
import { API_BASE_URL } from '../constants';

// Backend API Statistics Interface
export interface BackendStatistics {
  totalOrganisations: number;
  totalItems: number;
  sectors: string[];
  states: string[];
  cities: string[];
  capabilityTypes: string[];
}

// Backend Filter Options Interface
export interface BackendFilterOptions {
  sectors: string[];
  states: string[];
  cities: string[];
  capabilityTypes: string[];
}

export interface UseICNDataResult {
  companies: Company[];
  loading: boolean;
  error: string | null;
  searchResults: Company[];
  statistics: BackendStatistics | null;
  filterOptions: BackendFilterOptions | null;
  search: (searchText: string) => void;
  applyFilters: (filters: Partial<SearchFilters>) => void;
  getCompanyById: (id: string) => Promise<Company | undefined>;
  refresh: () => Promise<void>;
  // Backend-specific methods
  loadMore: (skip: number, limit: number) => Promise<Company[]>;
  getTotalCount: () => number;
}

export function useICNData(autoLoad: boolean = true): UseICNDataResult {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<BackendStatistics | null>(null);
  const [filterOptions, setFilterOptions] = useState<BackendFilterOptions | null>(null);
  const [currentFilters, setCurrentFilters] = useState<Partial<SearchFilters>>({});
  const [totalCount, setTotalCount] = useState<number>(0);
  const [allLoadedCompanies, setAllLoadedCompanies] = useState<Company[]>([]);

  // Convert OrganisationCard to Company format
  const convertOrganisationCardToCompany = useCallback((orgCard: OrganisationCard, index?: number): Company => {
    // Generate unique ID to prevent React key duplication
    const uniqueId = orgCard._id || `${orgCard.name}-${orgCard.street || ''}-${orgCard.city || ''}-${index || Date.now()}`;
    
    // Extract sectors from items
    const sectors = new Set<string>();
    const capabilities: string[] = [];
    const icnCapabilities: any[] = [];
    
    if (orgCard.items && Array.isArray(orgCard.items)) {
      orgCard.items.forEach((item: any) => {
        if (item.sectorName) {
          sectors.add(item.sectorName);
        }
        if (item.detailedItemName) {
          capabilities.push(item.detailedItemName);
        }
        if (item.itemName) {
          capabilities.push(item.itemName);
        }
        
        // Store ICN capability details
        icnCapabilities.push({
          capabilityId: item.organisationCapability || item.id,
          itemId: item.itemId,
          itemName: item.itemName,
          detailedItemName: item.detailedItemName,
          capabilityType: item.capabilityType,
          sectorName: item.sectorName,
          sectorMappingId: item.sectorMappingId
        });
      });
    }
    
    // Determine company type from capabilities
    let companyType: 'supplier' | 'manufacturer' | 'service' | 'consultant' | 'retail' | 'both' = 'supplier';
    if (icnCapabilities.length > 0) {
      const hasSupplier = icnCapabilities.some(cap => 
        cap.capabilityType === 'Supplier' || 
        cap.capabilityType === 'Item Supplier' || 
        cap.capabilityType === 'Parts Supplier'
      );
      const hasManufacturer = icnCapabilities.some(cap => 
        cap.capabilityType === 'Manufacturer' || 
        cap.capabilityType === 'Manufacturer (Parts)'
      );
      const hasService = icnCapabilities.some(cap => 
        cap.capabilityType === 'Service Provider'
      );
      
      if (hasSupplier && hasManufacturer) {
        companyType = 'both';
      } else if (hasManufacturer) {
        companyType = 'manufacturer';
      } else if (hasService) {
        companyType = 'service';
      }
    }
    
    return {
      id: uniqueId,
      name: orgCard.name || `Company ${index || 'Unknown'}`,
      address: `${orgCard.street || ''}, ${orgCard.city || ''}, ${orgCard.state || ''} ${orgCard.zip || ''}`.trim(),
      billingAddress: {
        street: orgCard.street || '',
        city: orgCard.city || '',
        state: orgCard.state || '',
        postcode: orgCard.zip || ''
      },
      latitude: 0, // Will be populated from coordinates if available
      longitude: 0, // Will be populated from coordinates if available
      verificationStatus: 'verified', // Assume verified for backend data
      keySectors: Array.from(sectors),
      capabilities: capabilities,
      companyType: companyType,
      icnCapabilities: icnCapabilities,
      dataSource: 'ICN',
      lastUpdated: new Date().toISOString()
    };
  }, []);

  // Convert Organisation to Company format (for detailed view)
  const convertOrganisationToCompany = useCallback((org: Organisation): Company => {
    const company = convertOrganisationCardToCompany(org as any);
    
    // Add coordinates if available
    if (org.coord && org.coord.coordinates && org.coord.coordinates.length >= 2) {
      company.longitude = org.coord.coordinates[0];
      company.latitude = org.coord.coordinates[1];
    }
    
    return company;
  }, [convertOrganisationCardToCompany]);

  // Load data from backend API
  const loadData = useCallback(async (forceReload: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading data from backend API...');
      
      // Load initial batch of organisations
      const orgCards = await organisationApiService.searchOrganisationsWithErrorHandling(
        0, 0, 100, 100, // Default search area
        {}, // No filters initially
        '', // No search text
        { skip: 0, limit: 100 } // Load first 100 records
      );
      
      console.log('📊 Backend returned organisations:', orgCards.length);
      console.log('📋 Sample organisation:', orgCards[0]);
      
      const loadedCompanies = orgCards.map((orgCard, index) => convertOrganisationCardToCompany(orgCard, index));
      console.log('🏢 Converted companies:', loadedCompanies.length);
      console.log('📋 Sample company:', loadedCompanies[0]);
      
      setCompanies(loadedCompanies);
      setSearchResults(loadedCompanies);
      setAllLoadedCompanies(loadedCompanies);
      setTotalCount(loadedCompanies.length); // This will be updated with actual total
      
      // Generate statistics from loaded data
      const stats = generateStatistics(loadedCompanies);
      setStatistics(stats);
      
      // Generate filter options from loaded data
      const filters = generateFilterOptions(loadedCompanies);
      setFilterOptions(filters);
      
      console.log('✅ Data loading completed successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data from backend';
      setError(errorMessage);
      console.error('❌ Error loading data from backend:', err);
    } finally {
      setLoading(false);
    }
  }, [convertOrganisationCardToCompany]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  // Search function using backend API
  const search = useCallback(async (searchText: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Searching for:', searchText);
      
      const orgCards = await organisationApiService.searchOrganisationsWithErrorHandling(
        0, 0, 100, 100, // Default search area
        {}, // No additional filters
        searchText, // Search text
        { skip: 0, limit: 100 } // Limit results
      );
      
      console.log('🔍 Search results:', orgCards.length);
      
      const results = orgCards.map((orgCard, index) => convertOrganisationCardToCompany(orgCard, index));
      setSearchResults(results);
      setCurrentFilters(prev => ({ ...prev, searchText }));
      
      console.log('🔍 Search completed, results set');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('❌ Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [convertOrganisationCardToCompany]);

  // Apply filters using backend API
  const applyFilters = useCallback(async (filters: Partial<SearchFilters>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build backend filter parameters
      const backendFilters: Record<string, any> = {};
      
      if (filters.state) {
        backendFilters.state = filters.state;
      }
      
      if (filters.sectors && filters.sectors.length > 0) {
        backendFilters.sectors = filters.sectors;
      }
      
      if (filters.companyTypes && filters.companyTypes.length > 0) {
        backendFilters.companyTypes = filters.companyTypes;
      }
      
      // Search with filters
      const orgCards = await organisationApiService.searchOrganisationsWithErrorHandling(
        filters.longitude || 0, // Use provided coordinates or default
        filters.latitude || 0,
        100, 100, // Default search area
        backendFilters,
        filters.searchText || '',
        { 
          skip: filters.page ? (filters.page - 1) * (filters.limit || 20) : 0, 
          limit: filters.limit || 100 
        }
      );
      
      let results = orgCards.map((orgCard, index) => convertOrganisationCardToCompany(orgCard, index));
      
      // Apply client-side filters that backend doesn't support
      if (filters.verificationStatus && filters.verificationStatus !== 'all') {
        results = results.filter(company =>
          company.verificationStatus === filters.verificationStatus
        );
      }
      
      // Distance filter (if coordinates provided)
      if (filters.latitude && filters.longitude && filters.distance) {
        results = results.filter(company => {
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
        results = sortCompanies(results, filters.sortBy, filters.sortOrder);
      }
      
      setSearchResults(results);
      setCurrentFilters(filters);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Filter application failed';
      setError(errorMessage);
      console.error('Filter error:', err);
    } finally {
      setLoading(false);
    }
  }, [convertOrganisationCardToCompany]);

  // Get company by ID using backend API
  const getCompanyById = useCallback(async (id: string): Promise<Company | undefined> => {
    try {
      // First check if we have it in our loaded data
      const existingCompany = allLoadedCompanies.find(company => company.id === id);
      if (existingCompany) {
        return existingCompany;
      }
      
      // If not found, fetch from backend
      const org = await organisationApiService.getOrganisationDetailsWithErrorHandling(id, 'current-user');
      if (org) {
        return convertOrganisationToCompany(org);
      }
      
      return undefined;
    } catch (err) {
      console.error('Error getting company by ID:', err);
      return undefined;
    }
  }, [allLoadedCompanies, convertOrganisationToCompany]);

  // Load more data (pagination)
  const loadMore = useCallback(async (skip: number, limit: number): Promise<Company[]> => {
    try {
      const orgCards = await organisationApiService.searchOrganisationsWithErrorHandling(
        0, 0, 100, 100, // Default search area
        {}, // No filters
        '', // No search text
        { skip, limit }
      );
      
      const newCompanies = orgCards.map((orgCard, index) => convertOrganisationCardToCompany(orgCard, index));
      setAllLoadedCompanies(prev => [...prev, ...newCompanies]);
      return newCompanies;
    } catch (err) {
      console.error('Error loading more data:', err);
      return [];
    }
  }, [convertOrganisationCardToCompany]);

  // Get total count
  const getTotalCount = useCallback(() => {
    return totalCount;
  }, [totalCount]);

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
    refresh,
    loadMore,
    getTotalCount
  };
}

// Helper function to generate statistics from companies
function generateStatistics(companies: Company[]): BackendStatistics {
  const sectors = new Set<string>();
  const states = new Set<string>();
  const cities = new Set<string>();
  const capabilityTypes = new Set<string>();
  
  companies.forEach(company => {
    // Collect sectors
    company.keySectors.forEach(sector => sectors.add(sector));
    
    // Collect states
    if (company.billingAddress?.state) {
      states.add(company.billingAddress.state);
    }
    
    // Collect cities
    if (company.billingAddress?.city) {
      cities.add(company.billingAddress.city);
    }
    
    // Collect capability types
    if (company.companyType) {
      capabilityTypes.add(company.companyType);
    }
  });
  
  return {
    totalOrganisations: companies.length,
    totalItems: companies.reduce((sum, company) => sum + (company.capabilities?.length || 0), 0),
    sectors: Array.from(sectors).sort(),
    states: Array.from(states).sort(),
    cities: Array.from(cities).sort(),
    capabilityTypes: Array.from(capabilityTypes).sort()
  };
}

// Helper function to generate filter options from companies
function generateFilterOptions(companies: Company[]): BackendFilterOptions {
  const stats = generateStatistics(companies);
  
  return {
    sectors: stats.sectors,
    states: stats.states,
    cities: stats.cities,
    capabilityTypes: stats.capabilityTypes
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

// Backend-specific hook for direct API integration
export function useBackendICNData(autoLoad: boolean = true): UseICNDataResult {
  return useICNData(autoLoad);
}

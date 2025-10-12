// services/hybridDataService.ts - Hybrid Data Service (Local + API)
import { Company, ICNItem, ICNCompanyData } from '../types';
import { organisationApiService, OrganisationCard } from './organisationApiService';
import icnDataService from './icnDataService'; // Import for fallback methods

/**
 * Hybrid data service
 * Combines local JSON data and backend API data
 */
export class HybridDataService {
  private static instance: HybridDataService;
  private useApi: boolean = true; // Can be configured to control whether to use API
  private companies: Company[] = [];
  private isLoading = false;
  private isLoaded = false;
  private lastLoadTime: Date | null = null;

  private constructor() {}

  static getInstance(): HybridDataService {
    if (!HybridDataService.instance) {
      HybridDataService.instance = new HybridDataService();
    }
    return HybridDataService.instance;
  }

  /**
   * Set whether to use API
   */
  setApiEnabled(enabled: boolean) {
    this.useApi = enabled;
  }

  /**
   * Load data - Initialize and load all data
   */
  async loadData(): Promise<void> {
    if (this.isLoaded) {
      console.log('Hybrid data already loaded');
      return;
    }
    
    if (this.isLoading) {
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
    
    this.isLoading = true;
    
    try {
      console.log(`Loading hybrid data (API: ${this.useApi})...`);
      
      // Try to load from backend API first (already has geocoded coordinates)
      if (this.useApi) {
        try {
          const apiCompanies = await organisationApiService.getAllOrganisations();
          if (apiCompanies && apiCompanies.length > 0) {
            this.companies = this.convertApiResultsToCompanies(apiCompanies);
            console.log(`Loaded ${this.companies.length} companies from backend (with geocoded coordinates)`);
            this.isLoaded = true;
            this.lastLoadTime = new Date();
            this.isLoading = false;
            return;
          } else {
            console.warn('Backend returned no companies, falling back to local data');
          }
        } catch (error) {
          console.warn('Backend API unavailable, falling back to local data:', error);
        }
      }
      
      // Fallback: Load local JSON data (requires frontend geocoding)
      console.log('Loading from local JSON data...');
      await icnDataService.loadData();
      this.companies = icnDataService.getCompanies();
      
      this.isLoaded = true;
      this.lastLoadTime = new Date();
      
      console.log(`Loaded ${this.companies.length} companies (hybrid mode)`);
      
    } catch (error) {
      console.error('Error loading hybrid data:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get all companies
   */
  getCompanies(): Company[] {
    return this.companies;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.companies = [];
    this.isLoaded = false;
    this.lastLoadTime = null;
    icnDataService.clearCache();
  }

  /**
   * Clear geocode cache only
   */
  async clearGeocodeCache() {
    await icnDataService.clearGeocodeCache();
  }

  /**
   * Check if data is loaded
   */
  isDataLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Get last load time
   */
  getLastLoadTime(): Date | null {
    return this.lastLoadTime;
  }

  /**
   * Get company by ID
   */
  getCompanyById(id: string): Company | undefined {
    return this.companies.find(company => company.id === id);
  }

  /**
   * Get companies by IDs (alias for getBatchCompanies)
   */
  getCompaniesByIds(ids: string[]): Company[] {
    return this.companies.filter(company => ids.includes(company.id));
  }

  /**
   * Get filter options
   */
  getFilterOptions() {
    return icnDataService.getFilterOptions();
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return icnDataService.getStatistics();
  }

  /**
   * Get territory statistics
   */
  getTerritoryStatistics() {
    return icnDataService.getTerritoryStatistics();
  }

  /**
   * Filter by state
   */
  filterByState(state: string): Company[] {
    return this.companies.filter(company => 
      company.billingAddress?.state === state
    );
  }

  /**
   * Filter by company type
   */
  filterByCompanyType(type: 'supplier' | 'manufacturer' | 'both'): Company[] {
    return icnDataService.filterByCompanyType(type);
  }

  /**
   * Filter by sector
   */
  filterBySector(sector: string): Company[] {
    return this.companies.filter(company =>
      company.keySectors.includes(sector)
    );
  }

  /**
   * Search companies - Prioritize API, fallback to local data on failure
   */
  async searchCompanies(
    searchText: string = '',
    location: string = '',
    filters: Record<string, any> = {},
    limit: number = 50
  ): Promise<Company[]> {
    if (this.useApi) {
      try {
        // Try to use API search
        const apiResults = await this.searchFromApi(searchText, location, filters, limit);
        if (apiResults.length > 0) {
          return this.convertApiResultsToCompanies(apiResults);
        }
      } catch (error) {
        console.warn('API search failed, falling back to local data:', error);
      }
    }

    // Fallback to local data search
    return this.searchFromLocal(searchText, location, filters, limit);
  }

  /**
   * Search companies (synchronous version for compatibility)
   */
  searchCompaniesSync(searchText: string): Company[] {
    const searchLower = searchText.toLowerCase().trim();
    
    if (!searchLower) return this.companies;
    
    return this.companies.filter(company => 
      company.name.toLowerCase().includes(searchLower) ||
      company.address.toLowerCase().includes(searchLower) ||
      company.keySectors.some(sector => sector.toLowerCase().includes(searchLower)) ||
      company.capabilities?.some(cap => cap.toLowerCase().includes(searchLower)) ||
      company.billingAddress?.city.toLowerCase().includes(searchLower) ||
      company.billingAddress?.state.toLowerCase().includes(searchLower) ||
      company.billingAddress?.postcode.includes(searchLower)
    );
  }

  /**
   * Search from API
   */
  private async searchFromApi(
    searchText: string,
    location: string,
    filters: Record<string, any>,
    limit: number
  ): Promise<OrganisationCard[]> {
    return await organisationApiService.searchOrganisationsWithErrorHandling(
      -200, -200, 400, 400, // Large search area to cover all of Australia
      filters,
      searchText,
      { skip: 0, limit }
    );
  }

  /**
   * Search from local data
   */
  private async searchFromLocal(
    searchText: string,
    location: string,
    filters: Record<string, any>,
    limit: number
  ): Promise<Company[]> {
    try {
      let companies = this.companies;
      
      // Apply search filters
      if (searchText) {
        companies = this.searchCompaniesSync(searchText);
      }
      
      // Apply location filters
      if (location) {
        companies = companies.filter(c => 
          c.billingAddress?.state === location
        );
      }
      
      // Apply other filter conditions
      if (filters.sector) {
        companies = companies.filter(c => 
          c.keySectors.includes(filters.sector)
        );
      }
      
      if (filters.companyType) {
        companies = this.filterByCompanyType(filters.companyType);
      }
      
      return companies.slice(0, limit);
    } catch (error) {
      console.error('Local data search failed:', error);
      return [];
    }
  }

  /**
   * Convert API results to Company format
   * Creates a unique Company entry for each organization-address combination
   */
  private convertApiResultsToCompanies(apiResults: OrganisationCard[]): Company[] {
    return apiResults.map((org, index) => {
      // Extract coordinates from backend if available
      let latitude = 0;
      let longitude = 0;
      
      if (org.coord && org.coord.coordinates && org.coord.coordinates.length === 2) {
        // Backend stores as [longitude, latitude] in GeoJSON format
        longitude = org.coord.coordinates[0];
        latitude = org.coord.coordinates[1];
      }
      
      // Create unique ID based on organization ID, address, and index to prevent duplicates
      const addressKey = `${org.street || ''}_${org.city || ''}_${org.state || ''}`.toLowerCase().replace(/\s+/g, '_');
      const addressHash = this.hashString(addressKey);
      const uniqueId = `${org._id || 'unknown'}_${addressHash}_${index}`;
      
      return {
        id: uniqueId,
        name: org.name || org.itemName || 'Unknown Company',
        address: [org.street, org.city, org.state, org.zip].filter(Boolean).join(', ') || 'Address Not Available',
        billingAddress: {
          street: org.street || '',
          city: org.city || '',
          state: org.state || 'VIC',
          postcode: org.zip || ''
        },
        latitude,
        longitude,
        verificationStatus: 'verified' as const,
        keySectors: org.sectorName ? [org.sectorName] : [],
        capabilities: [],
        dataSource: 'ICN' as const,
        lastUpdated: new Date().toISOString(),
        // Store original organization ID for potential grouping in detail screens
        organizationId: org._id || 'unknown'
      } as Company;
    });
  }

  /**
   * Simple hash function for address strings
   */
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get company details - Prioritize API
   */
  async getCompanyDetails(companyId: string, userId?: string): Promise<Company | null> {
    if (this.useApi && userId) {
      try {
        const apiDetails = await organisationApiService.getOrganisationDetailsWithErrorHandling(
          companyId,
          userId
        );
        
        if (apiDetails) {
          return this.convertApiDetailToCompany(apiDetails);
        }
      } catch (error) {
        console.warn('API get details failed, falling back to local data:', error);
      }
    }

    // Fallback to local data
    try {
      return this.getCompanyById(companyId) || null;
    } catch (error) {
      console.error('Local data query failed:', error);
      return null;
    }
  }

  /**
   * Convert API details to Company format
   */
  private convertApiDetailToCompany(org: any): Company {
    return {
      id: org._id,
      name: org.itemName || org.detailedItemName || 'Unknown Company',
      address: '',
      latitude: 0,
      longitude: 0,
      verificationStatus: 'verified' as const,
      keySectors: [org.sectorName || 'Unknown Sector'],
      capabilities: [org.detailedItemName || ''],
      description: org.detailedItemName || '',
      dataSource: 'ICN' as const,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Batch get company information
   */
  async getBatchCompanies(companyIds: string[]): Promise<Company[]> {
    if (this.useApi) {
      try {
        const apiResults = await organisationApiService.getBatchOrganisationsWithErrorHandling(companyIds);
        if (apiResults.length > 0) {
          return this.convertApiResultsToCompanies(apiResults);
        }
      } catch (error) {
        console.warn('API batch get failed, falling back to local data:', error);
      }
    }

    // Fallback to local data
    try {
      return this.getCompaniesByIds(companyIds);
    } catch (error) {
      console.error('Local batch query failed:', error);
      return [];
    }
  }

  /**
   * Get data source information
   */
  getDataSource(): 'api' | 'local' | 'hybrid' {
    return this.useApi ? 'hybrid' : 'local';
  }

  /**
   * Sync local data with API data (optional feature)
   */
  async syncLocalDataWithApi(): Promise<void> {
    if (!this.useApi) return;

    try {
      // Can implement periodic sync logic
      console.log('Syncing local data with API data...');
      
      // For example: get latest company list and update local cache
      const latestCompanies = await this.searchFromApi('', 'VIC', {}, 100);
      
      // Can implement cache update logic here
      console.log(`Synced ${latestCompanies.length} records`);
    } catch (error) {
      console.error('Data sync failed:', error);
    }
  }
}

// Export singleton instance
export const hybridDataService = HybridDataService.getInstance();
export default hybridDataService;
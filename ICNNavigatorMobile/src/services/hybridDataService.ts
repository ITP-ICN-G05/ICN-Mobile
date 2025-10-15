// services/hybridDataService.ts - Hybrid Data Service (Local + API)
import { Company, ICNItem, ICNCompanyData, CapabilityType } from '../types';
import { organisationApiService, OrganisationCard, BackendItem } from './organisationApiService';
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
        // Backend stores as [latitude, longitude] (NON-STANDARD order)
        // Extract them in the correct order for this backend
        latitude = org.coord.coordinates[0];  // First element is latitude
        longitude = org.coord.coordinates[1]; // Second element is longitude
        
        // Validate coordinate ranges
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          console.warn(`Invalid coordinates for ${org.name}: lat=${latitude}, lon=${longitude}`);
          latitude = 0;
          longitude = 0;
        }
      }
      
      // Create unique ID based on organization ID, address, and index to prevent duplicates
      const addressKey = `${org.street || ''}_${org.city || ''}_${org.state || ''}`.toLowerCase().replace(/\s+/g, '_');
      const addressHash = this.hashString(addressKey);
      const uniqueId = `${org._id || 'unknown'}_${addressHash}_${index}`;
      
      // ✅ Convert items to icnCapabilities
      const icnCapabilities = this.convertBackendItemsToCapabilities(org.items);
      
      // ✅ Extract capabilities string array from icnCapabilities
      const capabilities = icnCapabilities?.map(cap => cap.detailedItemName) || [];
      
      // ✅ Extract keySectors from icnCapabilities (deduplicated)
      const keySectors = [...new Set(
        (icnCapabilities || [])
          .map(cap => cap.sectorName)
          .filter(Boolean)
      )];
      
      // ✅ Generate mock data for missing fields
      const mockData = this.generateMockCompanyData(org._id || uniqueId);
      
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
        keySectors: keySectors.length > 0 ? keySectors : (org.sectorName ? [org.sectorName] : []),
        capabilities,  // ✅ Fixed: no longer empty array
        icnCapabilities,  // ✅ Fixed: contains full data
        companyType: this.deriveCompanyType(icnCapabilities),  // ✅ Derive company type from capabilities
        
        // ✅ Add mock data for fields not in backend
        abn: mockData.abn,
        employeeCount: mockData.employeeCount,
        revenue: mockData.revenue,
        diversityMarkers: mockData.diversityMarkers,
        ownershipType: mockData.ownershipType,
        socialEnterprise: mockData.socialEnterprise,
        australianDisabilityEnterprise: mockData.australianDisabilityEnterprise,
        certifications: mockData.certifications,
        localContentPercentage: mockData.localContentPercentage,
        description: mockData.description,
        
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
   * Convert backend items[] to frontend icnCapabilities[]
   */
  private convertBackendItemsToCapabilities(
    items: BackendItem[] | undefined
  ): Company['icnCapabilities'] {
    if (!items || items.length === 0) {
      return [];
    }

    return items.map((item, index) => ({
      capabilityId: item.organisationCapability || item.id || `cap_${index}`,
      itemId: item.itemId || '',
      itemName: item.itemName || 'Unknown Item',
      detailedItemName: item.detailedItemName || item.itemName || '',
      capabilityType: this.normalizeCapabilityType(item.capabilityType),
      sectorName: item.sectorName || 'Unknown Sector',
      sectorMappingId: item.sectorMappingId || '',
      localContentPercentage: this.generateMockLocalContent()  // Mock data
    }));
  }

  /**
   * Normalize capability type
   */
  private normalizeCapabilityType(type: string | undefined): CapabilityType {
    if (!type) return 'Service Provider';
    
    const typeMap: Record<string, CapabilityType> = {
      'supplier': 'Supplier',
      'item supplier': 'Item Supplier',
      'parts supplier': 'Parts Supplier',
      'manufacturer': 'Manufacturer',
      'manufacturer (parts)': 'Manufacturer (Parts)',
      'service provider': 'Service Provider',
      'project management': 'Project Management',
      'designer': 'Designer',
      'assembler': 'Assembler',
      'retailer': 'Retailer',
      'wholesaler': 'Wholesaler'
    };
    
    const normalized = type.toLowerCase().trim();
    return typeMap[normalized] || 'Service Provider';
  }

  /**
   * Derive companyType from icnCapabilities array
   */
  private deriveCompanyType(capabilities: Company['icnCapabilities']): Company['companyType'] {
    if (!capabilities || capabilities.length === 0) return undefined;
    
    const types = capabilities.map(c => c.capabilityType.toLowerCase());
    const hasSupplier = types.some(t => 
      t.includes('supplier') || t === 'item supplier' || t === 'parts supplier'
    );
    const hasManufacturer = types.some(t => 
      t.includes('manufacturer') || t === 'assembler'
    );
    
    if (hasSupplier && hasManufacturer) return 'both';
    if (hasManufacturer) return 'manufacturer';
    if (hasSupplier) return 'supplier';
    if (types.some(t => t.includes('service'))) return 'service';
    if (types.some(t => t.includes('retail'))) return 'retail';
    if (types.some(t => t.includes('consultant'))) return 'consultant';
    
    return undefined;
  }

  /**
   * Generate mock data for fields not provided by backend
   */
  private generateMockCompanyData(orgId: string) {
    // Use org ID as seed for consistent mock data
    const seedStr = this.hashString(orgId);
    const seed = parseInt(seedStr, 36) || 12345; // Convert to number, fallback to 12345
    const random = (min: number, max: number) => {
      const x = Math.sin(seed) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };

    return {
      // ABN: Australian Business Number (11 digits)
      abn: `${random(10, 99)}${random(100000000, 999999999)}`,
      
      // Employee count (tiered ranges)
      employeeCount: [5, 12, 25, 50, 100, 250, 500, 1000][random(0, 7)],
      
      // Revenue (in AUD)
      revenue: [500000, 1000000, 2500000, 5000000, 10000000, 25000000][random(0, 5)],
      
      // Diversity markers (30% chance for each)
      diversityMarkers: random(1, 10) > 7 ? [
        ['Female Owned Business', 'Social Enterprise', 'Australian Disability Enterprise'][random(0, 2)]
      ] : undefined,
      
      // Ownership type (30% chance)
      ownershipType: random(1, 10) > 7 ? [
        ['Female-owned', 'Indigenous-owned', 'Minority-owned'][random(0, 2)]
      ] : undefined,
      
      // Social enterprise (20% chance)
      socialEnterprise: random(1, 10) > 8,
      
      // Australian Disability Enterprise (10% chance)
      australianDisabilityEnterprise: random(1, 10) > 9,
      
      // Certifications (50% chance to have 1-3)
      certifications: random(1, 10) > 5 ? 
        ['ISO 9001', 'Australian-made Certification', 'Australian Standards']
          .slice(0, random(1, 3)) 
        : undefined,
      
      // Local content percentage (60-95%)
      localContentPercentage: random(60, 95),
      
      // Company description
      description: this.generateMockDescription(),
    };
  }

  /**
   * Generate mock local content percentage for capabilities (60-95%)
   */
  private generateMockLocalContent(): number {
    return Math.floor(Math.random() * 36) + 60; // 60-95%
  }

  /**
   * Generate mock company description
   */
  private generateMockDescription(): string {
    const templates = [
      'Leading Australian company specializing in innovative solutions and sustainable business practices. With over two decades of experience, we deliver exceptional value to our clients through cutting-edge technology and expert consultation services.',
      'Established supplier and manufacturer providing high-quality products and services to industries across Australia. Our commitment to excellence and customer satisfaction has made us a trusted partner in the sector.',
      'Australian-based enterprise with extensive experience in project delivery and service provision. We pride ourselves on our local content commitment and contribution to the Australian economy.',
    ];
    return templates[Math.floor(Math.random() * templates.length)];
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
   * Fetch full company details by organizationId (for detail page)
   */
  async fetchCompanyDetailsById(
    organizationId: string, 
    userId: string = 'default_user'
  ): Promise<Company | null> {
    if (!this.useApi) {
      return this.getCompanyById(organizationId) || null;
    }

    try {
      const response = await organisationApiService.getOrganisationDetails(
        organizationId,
        userId
      );

      if (!response.success || !response.data) {
        console.warn('Failed to fetch organisation details:', response.error);
        return null;
      }

      const org = response.data;
      
      // Convert to Company format
      const icnCapabilities = this.convertBackendItemsToCapabilities(org.items);
      const capabilities = icnCapabilities?.map(cap => cap.detailedItemName) || [];
      const keySectors = [...new Set(
        (icnCapabilities || [])
          .map(cap => cap.sectorName)
          .filter(Boolean)
      )];

      // Extract coordinates
      let latitude = 0;
      let longitude = 0;
      if (org.coord && org.coord.coordinates && org.coord.coordinates.length === 2) {
        latitude = org.coord.coordinates[0];
        longitude = org.coord.coordinates[1];
      }

      // Generate mock data
      const mockData = this.generateMockCompanyData(org._id);

      return {
        id: org._id,
        name: org.name || 'Unknown Company',
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
        keySectors,
        capabilities,
        icnCapabilities,
        companyType: this.deriveCompanyType(icnCapabilities),  // ✅ Derive company type from capabilities
        
        // Add mock data
        abn: mockData.abn,
        employeeCount: mockData.employeeCount,
        revenue: mockData.revenue,
        diversityMarkers: mockData.diversityMarkers,
        ownershipType: mockData.ownershipType,
        socialEnterprise: mockData.socialEnterprise,
        australianDisabilityEnterprise: mockData.australianDisabilityEnterprise,
        certifications: mockData.certifications,
        localContentPercentage: mockData.localContentPercentage,
        description: mockData.description,
        
        dataSource: 'ICN' as const,
        lastUpdated: new Date().toISOString(),
        organizationId: org._id
      } as Company;
    } catch (error) {
      console.error('Error fetching company details:', error);
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
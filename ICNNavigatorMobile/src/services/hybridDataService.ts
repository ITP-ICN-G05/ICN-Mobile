// services/hybridDataService.ts - Hybrid Data Service (Local + API)
import { Company, ICNItem, ICNCompanyData } from '../types';
import { organisationApiService, OrganisationCard } from './organisationApiService';
// import { icnDataService } from './icnDataService'; // Keep existing local data service

/**
 * Hybrid data service
 * Combines local JSON data and backend API data
 */
export class HybridDataService {
  private useApi: boolean = true; // Can be configured to control whether to use API

  /**
   * Set whether to use API
   */
  setApiEnabled(enabled: boolean) {
    this.useApi = enabled;
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
   * Search from API
   */
  private async searchFromApi(
    searchText: string,
    location: string,
    filters: Record<string, any>,
    limit: number
  ): Promise<OrganisationCard[]> {
    return await organisationApiService.searchOrganisationsWithErrorHandling(
      0, 0, 100, 100, // Default coordinates and search range
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
      // Integrate existing icnDataService
      const icnService = await import('./icnDataService');
      await icnService.default.loadData();
      
      let companies = icnService.default.getCompanies();
      
      // Apply search filters
      if (searchText) {
        companies = icnService.default.searchCompanies(searchText);
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
        companies = icnService.default.filterByCompanyType(filters.companyType);
      }
      
      return companies.slice(0, limit);
    } catch (error) {
      console.error('Local data search failed:', error);
      return [];
    }
  }

  /**
   * Convert API results to Company format
   */
  private convertApiResultsToCompanies(apiResults: OrganisationCard[]): Company[] {
    return apiResults.map(org => ({
      id: org._id,
      name: org.itemName || 'Unknown Company',
      address: '',
      latitude: 0,
      longitude: 0,
      verificationStatus: 'verified' as const,
      keySectors: [org.sectorName || 'Unknown Sector'],
      capabilities: [],
      dataSource: 'ICN' as const,
      lastUpdated: new Date().toISOString()
    }));
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
      const icnService = await import('./icnDataService');
      await icnService.default.loadData();
      return icnService.default.getCompanyById(companyId) || null;
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
      const icnService = await import('./icnDataService');
      await icnService.default.loadData();
      return icnService.default.getCompaniesByIds(companyIds);
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
export const hybridDataService = new HybridDataService();
export default hybridDataService;
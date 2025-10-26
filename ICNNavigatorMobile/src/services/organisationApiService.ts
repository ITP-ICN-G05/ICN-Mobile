// services/organisationApiService.ts - Organisation Service Based on Backend API Guide
import BaseApiService, { ApiResponse } from './apiConfig';
import { clampQueryBox, DEFAULT_QUERY_BOX } from '../utils/geoQuery';

/**
 * Validate if coordinates are within valid geographic bounds
 */
function isValidLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

function isValidLongitude(lon: number): boolean {
  return lon >= -180 && lon <= 180;
}

function isValidDelta(delta: number): boolean {
  return delta > 0 && delta <= 360;  // Allow up to 360 for global coverage
}

// Removed getGlobalDefaults() - no more world-extent queries

// Backend Item interface (matches backend Item.java)
export interface BackendItem {
  id?: string;
  detailedItemId?: string;
  itemName?: string;
  itemId?: string;
  detailedItemName?: string;
  sectorMappingId?: string;
  sectorName?: string;
  subtotal?: number;
  capabilityType?: string;
  validationDate?: string;
  organisationCapability?: string;
}

// Organisation related interface definitions - Based on Backend API Guide
export interface Organisation {
  _id: string;
  detailedItemID: string;
  itemName: string;
  itemID: string;
  detailedItemName: string;
  sectorMappingID: string;
  sectorName: string;
  Subtotal: number;
  // Additional fields from backend response
  name?: string;
  items?: BackendItem[];  // ← Explicit type
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  coord?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  [key: string]: any;
}

export interface OrganisationCard {
  // Organisation card data structure based on backend API
  id?: string;
  _id?: string;
  name: string;
  items?: BackendItem[];  // ← Explicit type
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  sectorName?: string;
  lontitude?: number;  // Match backend typo (line 76 in Organisation.java)
  latitude?: number;   // Direct latitude field from backend
  coord?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude] from backend (legacy support)
  };
  // Additional fields from backend response
  [key: string]: any;
}

export interface OrganisationSearchParams {
  startLatitude?: number;  // Optional, will use global default if invalid
  startLongitude?: number;  // Optional, will use global default if invalid
  endLatitude?: number;       // Optional, will use global default if invalid
  endLongitude?: number;       // Optional, will use global default if invalid
  filterParameters: Record<string, any>;
  searchString?: string;
  skip?: number;
  limit?: number;
}

/**
 * Organisation API service class
 * Based on backend API guide (http://localhost:8082/api)
 */
export class OrganisationApiService extends BaseApiService {

  /**
   * Search organisations
   * GET /api/organisation/general
   * 
   * @param params Search parameters
   * @returns Promise<ApiResponse<OrganisationCard[]>>
   */
  async searchOrganisations(params: OrganisationSearchParams): Promise<ApiResponse<OrganisationCard[]>> {
    // Require coordinates - no world defaults
    if (params.startLatitude === undefined || params.startLongitude === undefined ||
        params.endLatitude === undefined || params.endLongitude === undefined) {
      throw new Error('Geographic query parameters (startLatitude/startLongitude/endLatitude/endLongitude) are required');
    }

    // Build query parameters with new parameter names
    const queryParams: Record<string, any> = {
      startLatitude: params.startLatitude,
      startLongitude: params.startLongitude,
      endLatitude: params.endLatitude,
      endLongitude: params.endLongitude,
      filterParameters: JSON.stringify(params.filterParameters),
    };

    if (params.searchString) {
      queryParams.searchString = params.searchString;
    }
    if (params.skip !== undefined) {
      queryParams.skip = params.skip;
    }
    if (params.limit !== undefined) {
      // Cap limit at 3000 for worldwide search
      queryParams.limit = Math.min(params.limit, 3000);
    }

    return this.get<OrganisationCard[]>('/organisation/general', queryParams);
  }

  /**
   * Get organisation list by IDs
   * GET /api/organisation/generalByIds?ids={id1}&ids={id2}...
   * 
   * @param ids Organisation ID array
   * @returns Promise<ApiResponse<OrganisationCard[]>>
   */
  async getOrganisationsByIds(ids: string[]): Promise<ApiResponse<OrganisationCard[]>> {
    const queryParams: Record<string, any> = {};
    
    // Add parameters for each ID
    ids.forEach(id => {
      if (!queryParams.ids) {
        queryParams.ids = [];
      }
      queryParams.ids.push(id);
    });

    return this.get<OrganisationCard[]>('/organisation/generalByIds', queryParams);
  }

  /**
   * Get organisation details
   * GET /api/organisation/specific?organisationId={id}&user={userId}
   * 
   * @param organisationId Organisation ID
   * @param userId User ID
   * @returns Promise<ApiResponse<Organisation>>
   */
  async getOrganisationDetails(organisationId: string, userId: string): Promise<ApiResponse<Organisation>> {
    return this.get<Organisation>('/organisation/specific', {
      organisationId,
      user: userId
    });
  }

  /**
   * Search organisations with error handling
   * 
   * @param startLatitude Start latitude coordinate
   * @param startLongitude Start longitude coordinate
   * @param endLatitude End latitude coordinate
   * @param endLongitude End longitude coordinate
   * @param filters Filter conditions
   * @param searchText Search text
   * @param pagination Pagination parameters
   * @returns Promise<OrganisationCard[]>
   */
  async searchOrganisationsWithErrorHandling(
    startLatitude?: number,
    startLongitude?: number,
    endLatitude?: number,
    endLongitude?: number,
    filters: Record<string, any> = {},
    searchText: string = '',
    pagination: { skip?: number; limit?: number } = {}
  ): Promise<OrganisationCard[]> {
    try {
      // Provide safe default (worldwide region)
      const safeStartLatitude = startLatitude ?? DEFAULT_QUERY_BOX.locationY;
      const safeStartLongitude = startLongitude ?? DEFAULT_QUERY_BOX.locationX;
      const safeEndLatitude = endLatitude ?? (DEFAULT_QUERY_BOX.locationY + DEFAULT_QUERY_BOX.lenY);
      const safeEndLongitude = endLongitude ?? (DEFAULT_QUERY_BOX.locationX + DEFAULT_QUERY_BOX.lenX);

      const response = await this.searchOrganisations({
        startLatitude: safeStartLatitude,
        startLongitude: safeStartLongitude,
        endLatitude: safeEndLatitude,
        endLongitude: safeEndLongitude,
        filterParameters: filters,
        searchString: searchText,
        ...pagination
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        console.warn('Failed to search organisations:', response.error);
        return [];
      }
    } catch (error) {
      console.error('Error occurred while searching organisations:', error);
      return [];
    }
  }

  /**
   * Get organisation details with error handling
   * 
   * @param organisationId Organisation ID
   * @param userId User ID
   * @returns Promise<Organisation | null>
   */
  async getOrganisationDetailsWithErrorHandling(
    organisationId: string,
    userId: string
  ): Promise<Organisation | null> {
    try {
      const response = await this.getOrganisationDetails(organisationId, userId);

      if (response.success && response.data) {
        return response.data;
      } else {
        console.warn('Failed to get organisation details:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Error occurred while getting organisation details:', error);
      return null;
    }
  }

  /**
   * Batch get organisation information with error handling
   * 
   * @param ids Organisation ID array
   * @returns Promise<OrganisationCard[]>
   */
  async getBatchOrganisationsWithErrorHandling(ids: string[]): Promise<OrganisationCard[]> {
    try {
      if (ids.length === 0) {
        return [];
      }

      const response = await this.getOrganisationsByIds(ids);

      if (response.success && response.data) {
        return response.data;
      } else {
        console.warn('Failed to batch get organisations:', response.error);
        return [];
      }
    } catch (error) {
      console.error('Error occurred while batch getting organisations:', error);
      return [];
    }
  }

  /**
   * Get all organisations (for initial data load)
   * Uses progressive loading strategy to avoid timeouts
   */
  async getAllOrganisations(limit: number = 3000): Promise<OrganisationCard[]> {
    // Use worldwide region for initial load to get all companies
    const box = clampQueryBox(DEFAULT_QUERY_BOX);

    // Progressive loading strategy: start with smaller batches
    const batchSize = Math.min(limit, 3000); // Start with 3000 records
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt + 1}: Loading ${batchSize} organisations...`);
        
        const result = await this.searchOrganisationsWithErrorHandling(
          box.locationY, box.locationX, box.locationY + box.lenY, box.locationX + box.lenX,
          {},         // No filters
          '',         // No search text
          { skip: 0, limit: batchSize }
        );
        
        console.log(`✅ Successfully loaded ${result.length} organisations`);
        return result;
        
      } catch (error: any) {
        console.warn(`⚠️ Attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt === maxRetries - 1) {
          // Last attempt failed, try with even smaller batch
          console.log(`🔄 Final attempt: Trying with smaller batch (1000 records)...`);
          return await this.searchOrganisationsWithErrorHandling(
            box.locationY, box.locationX, box.locationY + box.lenY, box.locationX + box.lenX,
            {},         // No filters
            '',         // No search text
            { skip: 0, limit: 1000 }
          );
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return [];
  }

  /**
   * Search organisations within a map region
   * @param region Map region with latitude, longitude, and deltas
   * @param filters Filter parameters
   * @param searchText Search string
   * @param pagination Pagination parameters
   */
  async searchOrganisationsByRegion(
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    },
    filters: Record<string, any> = {},
    searchText: string = '',
    pagination: { skip?: number; limit?: number } = {}
  ): Promise<OrganisationCard[]> {
    const startLatitude = region.latitude - (region.latitudeDelta / 2);
    const startLongitude = region.longitude - (region.longitudeDelta / 2);
    const endLatitude = region.latitude + (region.latitudeDelta / 2);
    const endLongitude = region.longitude + (region.longitudeDelta / 2);
    
    return await this.searchOrganisationsWithErrorHandling(
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
      filters,
      searchText,
      pagination
    );
  }
}

/**
 * Normalize OrganisationCard data
 * Handle backend's lontitude typo for compatibility
 */
function normalizeOrganisationCard(card: any): OrganisationCard {
  return {
    ...card,
    // If needed to use correct spelling in app, map here
    longitude: card.lontitude || card.longitude,
    lontitude: card.lontitude || card.longitude,
  };
}

// Export singleton instance
export const organisationApiService = new OrganisationApiService();
export default organisationApiService;
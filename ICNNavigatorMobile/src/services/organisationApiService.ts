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
  locationX?: number;  // Optional, will use global default if invalid
  locationY?: number;  // Optional, will use global default if invalid
  lenX?: number;       // Optional, will use global default if invalid
  lenY?: number;       // Optional, will use global default if invalid
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
    if (params.locationX === undefined || params.locationY === undefined ||
        params.lenX === undefined || params.lenY === undefined) {
      throw new Error('Geographic query parameters (locationX/Y, lenX/Y) are required');
    }

    // Apply range clamping to prevent 500 errors
    const clamped = clampQueryBox({
      locationX: params.locationX,
      locationY: params.locationY,
      lenX: params.lenX,
      lenY: params.lenY
    });
    
    // Build query parameters with clamped values
    const queryParams: Record<string, any> = {
      locationX: clamped.locationX,
      locationY: clamped.locationY,
      lenX: clamped.lenX,
      lenY: clamped.lenY,
      filterParameters: JSON.stringify(params.filterParameters),
    };

    if (params.searchString) {
      queryParams.searchString = params.searchString;
    }
    if (params.skip !== undefined) {
      queryParams.skip = params.skip;
    }
    if (params.limit !== undefined) {
      // Cap limit at 5000 for worldwide search
      queryParams.limit = Math.min(params.limit, 5000);
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
   * @param locationX Location X coordinate
   * @param locationY Location Y coordinate
   * @param lenX Search range X length
   * @param lenY Search range Y length
   * @param filters Filter conditions
   * @param searchText Search text
   * @param pagination Pagination parameters
   * @returns Promise<OrganisationCard[]>
   */
  async searchOrganisationsWithErrorHandling(
    locationX?: number,
    locationY?: number,
    lenX?: number,
    lenY?: number,
    filters: Record<string, any> = {},
    searchText: string = '',
    pagination: { skip?: number; limit?: number } = {}
  ): Promise<OrganisationCard[]> {
    try {
      // Provide safe default (worldwide region)
      const safeBox = clampQueryBox({
        locationX: locationX ?? DEFAULT_QUERY_BOX.locationX,
        locationY: locationY ?? DEFAULT_QUERY_BOX.locationY,
        lenX: lenX ?? DEFAULT_QUERY_BOX.lenX,
        lenY: lenY ?? DEFAULT_QUERY_BOX.lenY
      });

      const response = await this.searchOrganisations({
        locationX: safeBox.locationX,
        locationY: safeBox.locationY,
        lenX: safeBox.lenX,
        lenY: safeBox.lenY,
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
   * Uses global coverage as default search area
   */
  async getAllOrganisations(limit: number = 1000): Promise<OrganisationCard[]> {
    // Use worldwide region for initial load to get all companies
    const box = clampQueryBox(DEFAULT_QUERY_BOX);

    return await this.searchOrganisationsWithErrorHandling(
      box.locationX, box.locationY, box.lenX, box.lenY,
      {},         // No filters
      '',         // No search text
      { skip: 0, limit: Math.min(limit, 5000) }  // Cap at 5000
    );
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
    const rawBox = {
      locationX: region.longitude - (region.longitudeDelta / 2),
      locationY: region.latitude - (region.latitudeDelta / 2),
      lenX: region.longitudeDelta,
      lenY: region.latitudeDelta
    };

    // Force range limits to prevent 500 errors
    const clamped = clampQueryBox(rawBox);
    
    return await this.searchOrganisationsWithErrorHandling(
      clamped.locationX,
      clamped.locationY,
      clamped.lenX,
      clamped.lenY,
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
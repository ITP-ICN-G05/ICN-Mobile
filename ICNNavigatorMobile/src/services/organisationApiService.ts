// services/organisationApiService.ts - Organisation Service Based on Backend API Guide
import BaseApiService, { ApiResponse } from './apiConfig';

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
  _id?: string;
  name: string;
  items?: BackendItem[];  // ← Explicit type
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  sectorName?: string;
  coord?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude] from backend
  };
  // Additional fields from backend response
  [key: string]: any;
}

export interface OrganisationSearchParams {
  locationX?: number;
  locationY?: number;
  lenX?: number;
  lenY?: number;
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
    // Build query parameters - Adjusted according to backend API guide
    const queryParams: Record<string, any> = {
      locationX: 0, // Default value, actual coordinates need to be passed when used
      locationY: 0, // Default value, actual coordinates need to be passed when used
      lenX: 100,    // Search range X length
      lenY: 100,    // Search range Y length
      filterParameters: JSON.stringify(params.filterParameters),
    };

    if (params.searchString) {
      queryParams.searchString = params.searchString;
    }
    if (params.skip !== undefined) {
      queryParams.skip = params.skip;
    }
    if (params.limit !== undefined) {
      queryParams.limit = params.limit;
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
    locationX: number = 0,
    locationY: number = 0,
    lenX: number = 100,
    lenY: number = 100,
    filters: Record<string, any> = {},
    searchText: string = '',
    pagination: { skip?: number; limit?: number } = {}
  ): Promise<OrganisationCard[]> {
    try {
      const response = await this.searchOrganisations({
        locationX,
        locationY,
        lenX,
        lenY,
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
   * Uses a large search area to get all companies
   */
  async getAllOrganisations(limit: number = 5000): Promise<OrganisationCard[]> {
    return await this.searchOrganisationsWithErrorHandling(
      -200, -200, // Starting coordinates
      400, 400,   // Large search area covering Australia/NZ
      {},         // No filters
      '',         // No search text
      { skip: 0, limit }
    );
  }
}

// Export singleton instance
export const organisationApiService = new OrganisationApiService();
export default organisationApiService;
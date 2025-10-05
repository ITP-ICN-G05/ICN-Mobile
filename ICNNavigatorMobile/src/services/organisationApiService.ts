// services/organisationApiService.ts - 基于后端API指南的组织服务
import BaseApiService, { ApiResponse } from './apiConfig';

// 组织相关接口定义 - 基于后端API指南
export interface Organisation {
  _id: string;
  detailedItemID: string;
  itemName: string;
  itemID: string;
  detailedItemName: string;
  sectorMappingID: string;
  sectorName: string;
  Subtotal: number;
}

export interface OrganisationCard {
  // 组织卡片数据结构（简化版本）
  _id: string;
  itemName: string;
  sectorName: string;
  // 根据实际后端返回的数据结构调整
}

export interface OrganisationSearchParams {
  location: string;
  filterParameters: Record<string, any>;
  searchString?: string;
  skip?: number;
  limit?: number;
}

/**
 * 组织API服务类
 * 基于后端API指南 (http://localhost:8082/api) 实现
 */
export class OrganisationApiService extends BaseApiService {

  /**
   * 搜索组织
   * GET /api/organisation/general
   * 
   * @param params 搜索参数
   * @returns Promise<ApiResponse<OrganisationCard[]>>
   */
  async searchOrganisations(params: OrganisationSearchParams): Promise<ApiResponse<OrganisationCard[]>> {
    // 构建查询参数
    const queryParams: Record<string, any> = {
      location: params.location,
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
   * 根据ID获取组织列表
   * GET /api/organisation/generalByIds?ids={id1}&ids={id2}...
   * 
   * @param ids 组织ID数组
   * @returns Promise<ApiResponse<OrganisationCard[]>>
   */
  async getOrganisationsByIds(ids: string[]): Promise<ApiResponse<OrganisationCard[]>> {
    const queryParams: Record<string, any> = {};
    
    // 为每个ID添加参数
    ids.forEach(id => {
      if (!queryParams.ids) {
        queryParams.ids = [];
      }
      queryParams.ids.push(id);
    });

    return this.get<OrganisationCard[]>('/organisation/generalByIds', queryParams);
  }

  /**
   * 获取组织详细信息
   * GET /api/organisation/specific?organisationId={id}&user={userId}
   * 
   * @param organisationId 组织ID
   * @param userId 用户ID
   * @returns Promise<ApiResponse<Organisation>>
   */
  async getOrganisationDetails(organisationId: string, userId: string): Promise<ApiResponse<Organisation>> {
    return this.get<Organisation>('/organisation/specific', {
      organisationId,
      user: userId
    });
  }

  /**
   * 带有错误处理的搜索组织方法
   * 
   * @param location 位置
   * @param filters 过滤条件
   * @param searchText 搜索文本
   * @param pagination 分页参数
   * @returns Promise<OrganisationCard[]>
   */
  async searchOrganisationsWithErrorHandling(
    location: string,
    filters: Record<string, any> = {},
    searchText: string = '',
    pagination: { skip?: number; limit?: number } = {}
  ): Promise<OrganisationCard[]> {
    try {
      const response = await this.searchOrganisations({
        location,
        filterParameters: filters,
        searchString: searchText,
        ...pagination
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        console.warn('搜索组织失败:', response.error);
        return [];
      }
    } catch (error) {
      console.error('搜索组织时发生错误:', error);
      return [];
    }
  }

  /**
   * 获取组织详情（带错误处理）
   * 
   * @param organisationId 组织ID
   * @param userId 用户ID
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
        console.warn('获取组织详情失败:', response.error);
        return null;
      }
    } catch (error) {
      console.error('获取组织详情时发生错误:', error);
      return null;
    }
  }

  /**
   * 批量获取组织信息（带错误处理）
   * 
   * @param ids 组织ID数组
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
        console.warn('批量获取组织失败:', response.error);
        return [];
      }
    } catch (error) {
      console.error('批量获取组织时发生错误:', error);
      return [];
    }
  }
}

// 导出单例实例
export const organisationApiService = new OrganisationApiService();
export default organisationApiService;
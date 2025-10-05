// services/hybridDataService.ts - 混合数据服务（本地+API）
import { Company, ICNItem, ICNCompanyData } from '../types';
import { organisationApiService, OrganisationCard } from './organisationApiService';
// import { icnDataService } from './icnDataService'; // 保留原有的本地数据服务

/**
 * 混合数据服务
 * 结合本地JSON数据和后端API数据
 */
export class HybridDataService {
  private useApi: boolean = true; // 可以通过配置控制是否使用API

  /**
   * 设置是否使用API
   */
  setApiEnabled(enabled: boolean) {
    this.useApi = enabled;
  }

  /**
   * 搜索公司 - 优先使用API，失败时降级到本地数据
   */
  async searchCompanies(
    searchText: string = '',
    location: string = '',
    filters: Record<string, any> = {},
    limit: number = 50
  ): Promise<Company[]> {
    if (this.useApi) {
      try {
        // 尝试使用API搜索
        const apiResults = await this.searchFromApi(searchText, location, filters, limit);
        if (apiResults.length > 0) {
          return this.convertApiResultsToCompanies(apiResults);
        }
      } catch (error) {
        console.warn('API搜索失败，降级到本地数据:', error);
      }
    }

    // 降级到本地数据搜索
    return this.searchFromLocal(searchText, location, filters, limit);
  }

  /**
   * 从API搜索
   */
  private async searchFromApi(
    searchText: string,
    location: string,
    filters: Record<string, any>,
    limit: number
  ): Promise<OrganisationCard[]> {
    return await organisationApiService.searchOrganisationsWithErrorHandling(
      location || 'VIC', // 默认维多利亚州
      filters,
      searchText,
      { skip: 0, limit }
    );
  }

  /**
   * 从本地数据搜索
   */
  private async searchFromLocal(
    searchText: string,
    location: string,
    filters: Record<string, any>,
    limit: number
  ): Promise<Company[]> {
    // TODO: 集成现有的icnDataService
    console.log('本地搜索暂未实现，返回空结果');
    return [];
  }

  /**
   * 将API结果转换为Company格式
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
   * 获取公司详情 - 优先使用API
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
        console.warn('API获取详情失败，降级到本地数据:', error);
      }
    }

    // TODO: 降级到本地数据
    console.log('本地数据查询暂未实现');
    return null;
  }

  /**
   * 将API详情转换为Company格式
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
   * 批量获取公司信息
   */
  async getBatchCompanies(companyIds: string[]): Promise<Company[]> {
    if (this.useApi) {
      try {
        const apiResults = await organisationApiService.getBatchOrganisationsWithErrorHandling(companyIds);
        if (apiResults.length > 0) {
          return this.convertApiResultsToCompanies(apiResults);
        }
      } catch (error) {
        console.warn('API批量获取失败，降级到本地数据:', error);
      }
    }

    // TODO: 降级到本地数据
    console.log('本地批量查询暂未实现');
    return [];
  }

  /**
   * 获取数据源信息
   */
  getDataSource(): 'api' | 'local' | 'hybrid' {
    return this.useApi ? 'hybrid' : 'local';
  }

  /**
   * 同步本地数据与API数据（可选功能）
   */
  async syncLocalDataWithApi(): Promise<void> {
    if (!this.useApi) return;

    try {
      // 可以实现定期同步逻辑
      console.log('同步本地数据与API数据...');
      
      // 例如：获取最新的公司列表并更新本地缓存
      const latestCompanies = await this.searchFromApi('', 'VIC', {}, 100);
      
      // 这里可以实现缓存更新逻辑
      console.log(`同步了 ${latestCompanies.length} 条记录`);
    } catch (error) {
      console.error('数据同步失败:', error);
    }
  }
}

// 导出单例实例
export const hybridDataService = new HybridDataService();
export default hybridDataService;
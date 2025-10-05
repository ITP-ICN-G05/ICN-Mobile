// services/userApiService.ts - 基于后端API指南的用户服务
import BaseApiService, { ApiResponse } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 用户相关接口定义 - 基于后端API指南
export interface User {
  id: string;
  VIP: number;
  email: string;
  name: string;
  password?: string;
  cards: string[];
}

export interface UserFull {
  name: string;
  VIP: number;
  cards: OrganisationCard[];
}

export interface InitialUser {
  email: string;
  name: string;
  password: string;
  code: string;
}

export interface OrganisationCard {
  // 组织卡片数据结构（根据实际后端返回调整）
  _id: string;
  itemName: string;
  sectorName: string;
  // ... 其他字段
}

export interface UserPayment {
  // 支付相关数据结构（待后端实现）
}

/**
 * 用户API服务类
 * 基于后端API指南 (http://localhost:8082/api) 实现
 */
export class UserApiService extends BaseApiService {
  
  /**
   * 用户登录
   * GET /api/user?email={email}&password={password}
   * 
   * @param email 用户邮箱
   * @param password 用户密码
   * @returns Promise<ApiResponse<UserFull>>
   */
  async login(email: string, password: string): Promise<ApiResponse<UserFull>> {
    const response = await this.get<UserFull>('/user', { email, password });
    
    // 如果登录成功，可以在这里保存用户信息
    if (response.success && response.data) {
      await this.saveUserData(response.data);
    }
    
    return response;
  }

  /**
   * 更新用户信息
   * PUT /api/user
   * 
   * @param userData 用户数据
   * @returns Promise<ApiResponse<void>>
   */
  async updateUser(userData: User): Promise<ApiResponse<void>> {
    return this.put<void>('/user', userData);
  }

  /**
   * 发送邮箱验证码
   * GET /api/user/getCode?email={email}
   * 
   * @param email 用户邮箱
   * @returns Promise<ApiResponse<void>>
   */
  async sendValidationCode(email: string): Promise<ApiResponse<void>> {
    return this.get<void>('/user/getCode', { email });
  }

  /**
   * 创建用户账户
   * POST /api/user/create
   * 
   * @param userData 初始用户数据
   * @returns Promise<ApiResponse<void>>
   */
  async createUser(userData: InitialUser): Promise<ApiResponse<void>> {
    return this.post<void>('/user/create', userData);
  }

  /**
   * 用户支付（未实现）
   * POST /api/user/payment
   * 
   * @param paymentData 支付数据
   * @returns Promise<ApiResponse<void>>
   */
  async processPayment(paymentData: UserPayment): Promise<ApiResponse<void>> {
    return this.post<void>('/user/payment', paymentData);
  }

  /**
   * 保存用户数据到本地存储
   */
  private async saveUserData(userData: UserFull): Promise<void> {
    try {
      await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
      console.log('✅ User data saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save user data:', error);
    }
  }

  /**
   * 获取本地存储的用户数据
   */
  async getLocalUserData(): Promise<UserFull | null> {
    try {
      const userData = await AsyncStorage.getItem('@user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Failed to get local user data:', error);
      return null;
    }
  }

  /**
   * 清除本地用户数据
   */
  async clearLocalUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['@user_data', '@auth_token']);
      console.log('✅ Local user data cleared');
    } catch (error) {
      console.error('❌ Failed to clear local user data:', error);
    }
  }

  /**
   * 检查用户是否已登录
   */
  async isLoggedIn(): Promise<boolean> {
    const userData = await this.getLocalUserData();
    return userData !== null;
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    await this.clearLocalUserData();
  }
}

// 导出单例实例
export const userApiService = new UserApiService();
export default userApiService;
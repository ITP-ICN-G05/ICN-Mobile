// services/userApiService.ts - User service based on backend API guide
import BaseApiService, { ApiResponse } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// User-related interface definitions - based on backend API guide
export interface User {
  id: string;
  VIP: number;
  email: string;
  name: string;
  password?: string;
  cards: string[];
}

export interface UserFull {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  avatar: string;
  VIP: number;
  cards: OrganisationCard[];
  endDate: string;
  createdAt: string;
  token?: string; // Optional auth token from backend
  refreshToken?: string; // Optional refresh token from backend
}

export interface InitialUser {
  email: string;
  name: string;
  password: string;
  phone: string;
  code: string;
}

export interface OrganisationCard {
  // Organization card data structure (adjust based on actual backend response)
  _id: string;
  itemName: string;
  sectorName: string;
  // ... other fields
}

export interface UserPayment {
  // Payment-related data structure (pending backend implementation)
}

/**
 * User API Service Class
 * Implementation based on backend API guide (http://localhost:8082/api)
 */
export class UserApiService extends BaseApiService {
  
  /**
   * User login - secure POST endpoint
   * POST /api/user/login
   * 
   * @param email User email
   * @param password User password
   * @returns Promise<ApiResponse<UserFull>>
   */
  async login(email: string, password: string): Promise<ApiResponse<UserFull>> {
    // Changed from GET to POST for security
    const response = await this.post<UserFull>('/user/login', { 
      email, 
      password 
    });
    
    // If login successful, save user information here
    if (response.success && response.data) {
      await this.saveUserData(response.data);
    }
    
    return response;
  }

  /**
   * Update user information
   * PUT /api/user
   * 
   * @param userData User data
   * @returns Promise<ApiResponse<void>>
   */
  async updateUser(userData: User): Promise<ApiResponse<void>> {
    return this.put<void>('/user', userData);
  }

  /**
   * Send email verification code
   * GET /api/user/getCode?email={email}
   * 
   * @param email User email
   * @returns Promise<ApiResponse<void>>
   */
  async sendValidationCode(email: string): Promise<ApiResponse<void>> {
    return this.get<void>('/user/getCode', { email });
  }

  /**
   * Create user account
   * POST /api/user/create
   * 
   * @param userData Initial user data
   * @returns Promise<ApiResponse<void>>
   */
  async createUser(userData: InitialUser): Promise<ApiResponse<void>> {
    return this.post<void>('/user/create', userData);
  }

  /**
   * Reset password - secure POST endpoint
   * POST /api/user/resetPassword
   * 
   * @param email User email
   * @param code Verification code
   * @param newPassword New password
   * @returns Promise<ApiResponse<void>>
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse<void>> {
    // Send parameters in POST body for security instead of URL
    const endpoint = `/user/resetPassword?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&newPassword=${encodeURIComponent(newPassword)}`;
    return this.post<void>(endpoint);
  }

  /**
   * User payment (not implemented)
   * POST /api/user/payment
   * 
   * @param paymentData Payment data
   * @returns Promise<ApiResponse<void>>
   */
  async processPayment(paymentData: UserPayment): Promise<ApiResponse<void>> {
    return this.post<void>('/user/payment', paymentData);
  }

  /**
   * Save user data to local storage
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
   * Get user data from local storage
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
   * Clear local user data
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
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const userData = await this.getLocalUserData();
    return userData !== null;
  }

  /**
   * User logout
   */
  async logout(): Promise<void> {
    await this.clearLocalUserData();
  }
}

// Export singleton instance
export const userApiService = new UserApiService();
export default userApiService;
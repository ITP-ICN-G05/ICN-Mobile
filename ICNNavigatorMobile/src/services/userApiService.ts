// services/userApiService.ts - User service based on backend API guide
import BaseApiService, { ApiResponse } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PasswordHasher } from '../utils/passwordHasher';

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
  organisationCards?: OrganisationCard[];  // Backend uses this field name
  premium?: number;  // Backend uses premium instead of VIP
  subscribeDueDate?: string;  // Backend uses this field name
  // Keep backward compatibility fields
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  avatar?: string;
  VIP?: number;  // Backward compatibility
  cards?: OrganisationCard[];  // Backward compatibility
  endDate?: string;  // Backward compatibility
  createdAt?: string;
  token?: string; // Optional auth token from backend
  refreshToken?: string; // Optional refresh token from backend
}

export interface InitialUser {
  email: string;
  name: string;
  password: string;
  code: string;  // Backend requires this field
  phone?: string;  // Optional field
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
   * User login - GET endpoint with query parameters
   * GET /api/user?email={email}&password={hashedPassword}
   * 
   * @param email User email
   * @param password User password (will be hashed before sending)
   * @returns Promise<ApiResponse<UserFull>>
   */
  async login(email: string, password: string): Promise<ApiResponse<UserFull>> {
    // Hash the password before sending to backend
    const hashedPassword = await PasswordHasher.hash(password);
    
    // Use GET with query parameters to match backend implementation
    const response = await this.get<UserFull>('/user', { 
      email, 
      password: hashedPassword 
    });
    
    // If login successful, save user information and hashed password
    if (response.success && response.data) {
      await this.saveUserData(response.data);
      // Store hashed password for bookmark functionality
      await this.saveHashedPassword(hashedPassword);
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
  async updateUser(userData: Partial<User>): Promise<ApiResponse<void>> {
    // Extract only basic fields that sync to backend (name, email, password)
    const backendData: any = {
      id: userData.id,
      email: userData.email,
      name: userData.name
    };
    
    // Hash password if provided
    if (userData.password) {
      backendData.password = await PasswordHasher.hash(userData.password);
    }
    
    // Remove undefined values
    Object.keys(backendData).forEach(key => 
      backendData[key] === undefined && delete backendData[key]
    );
    
    return this.put<void>('/user', backendData);
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
    // Hash the password before sending to backend
    const hashedPassword = await PasswordHasher.hash(userData.password);
    
    // Build clean request body - omit phone if empty
    const requestBody: any = {
      email: userData.email.trim(),
      name: userData.name.trim(),
      password: hashedPassword,
      code: userData.code.trim(),
    };
    
    // Only include phone if it has a value
    if (userData.phone && userData.phone.trim()) {
      requestBody.phone = userData.phone.trim();
    }
    
    const response = await this.post<void>('/user/create', requestBody);
    
    // If registration successful, store hashed password for bookmark functionality
    if (response.success) {
      await this.saveHashedPassword(hashedPassword);
    }
    
    return response;
  }

  /**
   * Reset password - secure POST endpoint
   * POST /api/user/resetPassword
   * 
   * @param email User email
   * @param code Verification code
   * @param newPassword New password (will be hashed before sending)
   * @returns Promise<ApiResponse<void>>
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse<void>> {
    // Hash the new password before sending to backend
    const hashedPassword = await PasswordHasher.hash(newPassword);
    
    // Send parameters in POST body for security instead of URL
    const endpoint = `/user/resetPassword?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}&newPassword=${encodeURIComponent(hashedPassword)}`;
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
   * Save hashed password to local storage for bookmark functionality
   */
  private async saveHashedPassword(hashedPassword: string): Promise<void> {
    try {
      await AsyncStorage.setItem('@user_password_hash', hashedPassword);
      console.log('✅ Hashed password saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save hashed password:', error);
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
   * Get stored hashed password from local storage
   */
  async getStoredHashedPassword(): Promise<string | null> {
    try {
      const hashedPassword = await AsyncStorage.getItem('@user_password_hash');
      return hashedPassword;
    } catch (error) {
      console.error('❌ Failed to get stored hashed password:', error);
      return null;
    }
  }

  /**
   * Clear local user data
   */
  async clearLocalUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['@user_data', '@auth_token', '@user_password_hash']);
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
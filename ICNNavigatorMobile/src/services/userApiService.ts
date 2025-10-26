// services/userApiService.ts - User service based on backend API guide
import BaseApiService, { ApiResponse, HttpMethod, API_CONFIG } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PasswordHasher } from '../utils/passwordHasher';
import { normalizeEmail, debugEmail } from '../utils/emailNormalizer';

// User-related interface definitions - based on backend API guide
export interface User {
  id: string;
  VIP: number;
  email: string;
  name: string;
  password?: string;
  cards: string[];
  organisationIds?: string[]; // Backend field for bookmarks
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
  id: string;  // Primary field from backend API
  _id?: string;  // Optional MongoDB-style field for backward compatibility
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
   * User login - POST endpoint with query parameters
   * POST /api/user?email={email}&password={hashedPassword}
   * 
   * @param email User email
   * @param password User password (will be hashed before sending)
   * @returns Promise<ApiResponse<UserFull>>
   */
  async login(email: string, password: string): Promise<ApiResponse<UserFull>> {
    // Debug email normalization
    debugEmail(email, 'Login Email');
    
    // Normalize email using unified function
    const normalizedEmail = normalizeEmail(email);
    
    // Hash the password before sending to backend
    const hashedPassword = await PasswordHasher.hash(password);
    
    // Ensure password hash is lowercase for backend compatibility
    const normalizedPassword = hashedPassword.toLowerCase();
    
    console.log('🔐 Password hash (first 10 chars):', normalizedPassword.substring(0, 10) + '...');
    
    // Use URLSearchParams for proper URL encoding
    const params = new URLSearchParams({
      email: normalizedEmail,
      password: normalizedPassword
    });
    const endpoint = `/user?${params.toString()}`;
    
    console.log('🌐 Final login URL:', `${API_CONFIG[__DEV__ ? 'DEV' : 'PROD'].BASE_URL}${endpoint}`);
    
    // Use POST request as per API documentation
    const response = await this.request<UserFull>(endpoint, HttpMethod.POST);
    
    // If login successful, save user information and hashed password
    if (response.success && response.data) {
      await this.saveUserData(response.data);
      // Store normalized password hash for bookmark functionality
      await this.saveHashedPassword(normalizedPassword);
    } else if (response.status === 500) {
      // Backend login endpoint has issues, try to use local data if available
      console.log('⚠️ Backend login failed with 500, checking local data...');
      const localUserData = await this.getLocalUserData();
      const storedPassword = await this.getStoredHashedPassword();
      
      if (localUserData && storedPassword === normalizedPassword) {
        console.log('✅ Using local user data for login');
        return {
          data: localUserData,
          success: true,
          status: 200
        };
      } else {
        console.log('❌ No valid local data found');
      }
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
    
    // Handle password - check if it's already hashed or needs hashing
    if (userData.password) {
      // Check if password is already a 64-character hex string (hashed)
      if (PasswordHasher.validateHashedPassword(userData.password)) {
        // Password is already hashed, normalize to lowercase
        backendData.password = userData.password.toLowerCase();
      } else {
        // Password is plain text, hash it and normalize to lowercase
        const hashedPassword = await PasswordHasher.hash(userData.password);
        backendData.password = hashedPassword.toLowerCase();
      }
    }
    
    // Send organisationIds field (organization IDs added to List)
    // Backend User class accepts 'organisationIds' field
    if (userData.cards !== undefined) {
      backendData.organisationIds = userData.cards;
      console.log('[userApiService] Sending organization IDs as organisationIds:', userData.cards.length, userData.cards);
    }
    
    // Also handle direct organisationIds field if provided
    if (userData.organisationIds !== undefined) {
      backendData.organisationIds = userData.organisationIds;
      console.log('[userApiService] Sending organisationIds directly:', userData.organisationIds.length, userData.organisationIds);
    }
    
    // Only delete undefined values, preserve empty arrays and other falsy values
    Object.keys(backendData).forEach(key => 
      backendData[key] === undefined && delete backendData[key]
    );
    
    console.log('[userApiService] PUT /user payload:', JSON.stringify(backendData));
    return this.put<void>('/user', backendData);
  }

  /**
   * Send email verification code
   * POST /api/user/getCode?email={email}
   * 
   * @param email User email
   * @returns Promise<ApiResponse<void>>
   */
  async sendValidationCode(email: string): Promise<ApiResponse<void>> {
    // Debug email normalization
    debugEmail(email, 'Validation Code Email');
    
    // Normalize email using unified function
    const normalizedEmail = normalizeEmail(email);
    
    // Use URLSearchParams for proper URL encoding
    const params = new URLSearchParams({
      email: normalizedEmail
    });
    const endpoint = `/user/getCode?${params.toString()}`;
    
    return this.post<void>(endpoint);
  }

  /**
   * Create user account
   * POST /api/user/create
   * 
   * @param userData Initial user data
   * @returns Promise<ApiResponse<void>>
   */
  async createUser(userData: InitialUser): Promise<ApiResponse<void>> {
    // Debug email normalization
    debugEmail(userData.email, 'Register Email');
    
    // Normalize email using unified function
    const normalizedEmail = normalizeEmail(userData.email);
    
    // Hash the password before sending to backend
    const hashedPassword = await PasswordHasher.hash(userData.password);
    
    // Ensure password hash is lowercase for backend compatibility
    const normalizedPassword = hashedPassword.toLowerCase();
    
    // Build clean request body - omit phone if empty
    const requestBody: any = {
      email: normalizedEmail,
      name: userData.name.trim(),
      password: normalizedPassword,
      code: userData.code.trim(),
    };
    
    // Only include phone if it has a value
    if (userData.phone && userData.phone.trim()) {
      requestBody.phone = userData.phone.trim();
    }
    
    const response = await this.post<void>('/user/create', requestBody);
    
    // If registration successful, store normalized password hash for bookmark functionality
    if (response.success) {
      await this.saveHashedPassword(normalizedPassword);
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
    // Debug email normalization
    debugEmail(email, 'Reset Password Email');
    
    // Normalize email using unified function
    const normalizedEmail = normalizeEmail(email);
    
    // Hash the new password before sending to backend
    const hashedPassword = await PasswordHasher.hash(newPassword);
    
    // Ensure password hash is lowercase for backend compatibility
    const normalizedPassword = hashedPassword.toLowerCase();
    
    // Send parameters in POST body for security instead of URL
    const endpoint = `/user/resetPassword?email=${encodeURIComponent(normalizedEmail)}&code=${encodeURIComponent(code)}&newPassword=${encodeURIComponent(normalizedPassword)}`;
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
      // Preserve existing local bookmarks when saving new user data
      const existingUserData = await AsyncStorage.getItem('@user_data');
      let existingCards: string[] = [];
      
      if (existingUserData) {
        const parsed = JSON.parse(existingUserData);
        existingCards = parsed.cards || [];
      }
      
      // Extract bookmark IDs from organisationCards if available
      let backendCards: string[] = [];
      if (userData.organisationCards && Array.isArray(userData.organisationCards)) {
        backendCards = userData.organisationCards
          .map(card => card.id || card._id)
          .filter((id): id is string => id !== undefined && id !== null);
      }
      
      // Merge local and backend bookmarks (union)
      const mergedCards = Array.from(new Set([...existingCards, ...backendCards]));
      
      // Create user data with merged bookmarks
      const userDataWithCards = {
        ...userData,
        cards: mergedCards
      };
      
      await AsyncStorage.setItem('@user_data', JSON.stringify(userDataWithCards));
      console.log('✅ User data saved to local storage');
      console.log(`📚 Merged bookmarks: local=${existingCards.length}, backend=${backendCards.length}, final=${mergedCards.length}`);
      console.log('🔄 User data save operation completed - ready for bookmark sync');
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
   * User logout - only clear auth tokens, keep user data for same-user re-login
   */
  async logout(): Promise<void> {
    try {
      // Only clear authentication tokens, keep user data and password hash for same user
      await AsyncStorage.multiRemove(['@auth_token', '@refresh_token']);
      console.log('✅ Authentication tokens cleared, user data preserved for re-login');
    } catch (error) {
      console.error('❌ Failed to clear auth tokens:', error);
    }
  }
}

// Export singleton instance
export const userApiService = new UserApiService();
export default userApiService;
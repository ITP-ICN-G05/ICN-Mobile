import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApiService, UserFull, InitialUser } from './userApiService';
import { PasswordHasher } from '../utils/passwordHasher';

class AuthService {
  private static TOKEN_KEY = '@auth_token';
  private static USER_KEY = '@user_data';
  private static REFRESH_TOKEN_KEY = '@refresh_token';

  /**
   * User login - integrated with backend API
   */
  static async login(email: string, password: string): Promise<UserFull> {
    const response = await userApiService.login(email, password);
    
    if (response.success && response.data) {
      // Backend should return token in response
      return response.data;
    } else {
      throw new Error(response.error || 'Login failed');
    }
  }

  /**
   * User registration - integrated with backend API
   */
  static async register(userData: InitialUser): Promise<void> {
    const response = await userApiService.createUser(userData);
    
    if (!response.success) {
      throw new Error(response.error || 'Registration failed');
    }
  }

  /**
   * Send verification code
   */
  static async sendValidationCode(email: string): Promise<void> {
    const response = await userApiService.sendValidationCode(email);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to send verification code');
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const response = await userApiService.resetPassword(email, code, newPassword);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to reset password');
    }
  }

  /**
   * User logout - only clear auth tokens, keep user data for same-user re-login
   */
  static async signOut(): Promise<void> {
    try {
      // Only clear authentication tokens, keep user data for same user
      await AsyncStorage.multiRemove([
        this.TOKEN_KEY,
        this.REFRESH_TOKEN_KEY,
      ]);

      // Clear any cached data
      await this.clearCachedData();

      // Use the userApiService to logout
      await userApiService.logout();

      // Optionally call backend to invalidate token
      await this.invalidateServerSession();
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  }

  /**
   * Check if user is logged in
   */
  static async isLoggedIn(): Promise<boolean> {
    return await userApiService.isLoggedIn();
  }

  /**
   * Get current user data
   */
  static async getCurrentUser(): Promise<UserFull | null> {
    return await userApiService.getLocalUserData();
  }

  private static async clearCachedData(): Promise<void> {
    const keysToRemove = [
      '@saved_companies',
      '@recent_searches',
      '@user_preferences',
      '@subscription_data',
    ];
    await AsyncStorage.multiRemove(keysToRemove);
  }

  private static async invalidateServerSession(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(this.TOKEN_KEY);
      if (token) {
        // Use unified API configuration
        const { getApiBaseUrl } = await import('./apiConfig');
        const API_BASE_URL = getApiBaseUrl();
        
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.warn('Failed to invalidate server session:', error);
    }
  }

  static async deleteAccount(password: string): Promise<void> {
    const token = await AsyncStorage.getItem(this.TOKEN_KEY);
    
    // Hash the password before sending to backend
    const hashedPassword = await PasswordHasher.hash(password);
    
    // Use unified API configuration
    const { getApiBaseUrl } = await import('./apiConfig');
    const API_BASE_URL = getApiBaseUrl();
    
    const response = await fetch(`${API_BASE_URL}/account/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        password: hashedPassword,
        confirmDeletion: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete account');
    }

    await this.signOut();
  }
}

export default AuthService;
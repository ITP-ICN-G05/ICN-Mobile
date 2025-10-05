import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApiService, UserFull, InitialUser } from './userApiService';

class AuthService {
  private static TOKEN_KEY = '@auth_token';
  private static USER_KEY = '@user_data';
  private static REFRESH_TOKEN_KEY = '@refresh_token';

  /**
   * 用户登录 - 集成后端API
   */
  static async login(email: string, password: string): Promise<UserFull> {
    const response = await userApiService.login(email, password);
    
    if (response.success && response.data) {
      // 保存认证令牌（如果后端提供）
      // await AsyncStorage.setItem(this.TOKEN_KEY, token);
      return response.data;
    } else {
      throw new Error(response.error || '登录失败');
    }
  }

  /**
   * 用户注册 - 集成后端API
   */
  static async register(userData: InitialUser): Promise<void> {
    const response = await userApiService.createUser(userData);
    
    if (!response.success) {
      throw new Error(response.error || '注册失败');
    }
  }

  /**
   * 发送验证码
   */
  static async sendValidationCode(email: string): Promise<void> {
    const response = await userApiService.sendValidationCode(email);
    
    if (!response.success) {
      throw new Error(response.error || '发送验证码失败');
    }
  }

  /**
   * 用户登出
   */
  static async signOut(): Promise<void> {
    try {
      // Clear all authentication tokens
      await AsyncStorage.multiRemove([
        this.TOKEN_KEY,
        this.USER_KEY,
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
   * 检查是否已登录
   */
  static async isLoggedIn(): Promise<boolean> {
    return await userApiService.isLoggedIn();
  }

  /**
   * 获取当前用户数据
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
        await fetch('https://api.icnvictoria.com/auth/logout', {
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
    
    const response = await fetch('https://api.icnvictoria.com/account/delete', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        password,
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
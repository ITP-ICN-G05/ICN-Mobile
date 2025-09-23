import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  private static TOKEN_KEY = '@auth_token';
  private static USER_KEY = '@user_data';
  private static REFRESH_TOKEN_KEY = '@refresh_token';

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

      // Optionally call backend to invalidate token
      await this.invalidateServerSession();
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
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
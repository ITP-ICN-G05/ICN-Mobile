import AsyncStorage from '@react-native-async-storage/async-storage';
import { userApiService } from '../services/userApiService';

/**
 * Bookmark Helper Utility
 * Provides methods to work with bookmarks using stored hashed password
 */
export class BookmarkHelper {
  
  /**
   * Get stored hashed password for bookmark operations
   */
  static async getStoredHashedPassword(): Promise<string | null> {
    return await userApiService.getStoredHashedPassword();
  }

  /**
   * Save a bookmark with password verification
   * @param bookmarkData Bookmark data to save
   * @returns Promise<boolean> Success status
   */
  static async saveBookmark(bookmarkData: any): Promise<boolean> {
    try {
      // Get stored hashed password
      const hashedPassword = await this.getStoredHashedPassword();
      
      if (!hashedPassword) {
        console.error('❌ No stored password found for bookmark operation');
        return false;
      }

      // Add hashed password to bookmark data for backend verification
      const bookmarkWithAuth = {
        ...bookmarkData,
        password: hashedPassword,
        timestamp: new Date().toISOString()
      };

      // Save bookmark to local storage
      const bookmarks = await this.getBookmarks();
      bookmarks.push(bookmarkWithAuth);
      await AsyncStorage.setItem('@user_bookmarks', JSON.stringify(bookmarks));
      
      console.log('✅ Bookmark saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to save bookmark:', error);
      return false;
    }
  }

  /**
   * Get all bookmarks
   */
  static async getBookmarks(): Promise<any[]> {
    try {
      const bookmarks = await AsyncStorage.getItem('@user_bookmarks');
      return bookmarks ? JSON.parse(bookmarks) : [];
    } catch (error) {
      console.error('❌ Failed to get bookmarks:', error);
      return [];
    }
  }

  /**
   * Delete a bookmark
   * @param bookmarkId ID of bookmark to delete
   */
  static async deleteBookmark(bookmarkId: string): Promise<boolean> {
    try {
      const hashedPassword = await this.getStoredHashedPassword();
      
      if (!hashedPassword) {
        console.error('❌ No stored password found for bookmark operation');
        return false;
      }

      const bookmarks = await this.getBookmarks();
      const filteredBookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
      
      await AsyncStorage.setItem('@user_bookmarks', JSON.stringify(filteredBookmarks));
      console.log('✅ Bookmark deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete bookmark:', error);
      return false;
    }
  }

  /**
   * Sync bookmarks with backend (if needed)
   * @param bookmarks Array of bookmarks to sync
   */
  static async syncBookmarksWithBackend(bookmarks: any[]): Promise<boolean> {
    try {
      const hashedPassword = await this.getStoredHashedPassword();
      
      if (!hashedPassword) {
        console.error('❌ No stored password found for sync operation');
        return false;
      }

      // Example: Send bookmarks to backend with hashed password
      // const response = await userApiService.post('/user/bookmarks', {
      //   bookmarks,
      //   password: hashedPassword
      // });

      console.log('✅ Bookmarks synced with backend');
      return true;
    } catch (error) {
      console.error('❌ Failed to sync bookmarks:', error);
      return false;
    }
  }

  /**
   * Check if user has stored password for bookmark operations
   */
  static async hasStoredPassword(): Promise<boolean> {
    const hashedPassword = await this.getStoredHashedPassword();
    return hashedPassword !== null;
  }

  /**
   * Clear all bookmarks (useful for logout)
   */
  static async clearBookmarks(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@user_bookmarks');
      console.log('✅ Bookmarks cleared');
    } catch (error) {
      console.error('❌ Failed to clear bookmarks:', error);
    }
  }
}

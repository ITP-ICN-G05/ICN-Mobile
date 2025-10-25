/**
 * Bookmark Service
 * Handles all bookmark-related API calls to the backend
 * Uses PUT /user to update user.cards array with hashed password authentication
 */

import { getApiBaseUrl, fetchWithTimeout } from './apiConfig';
import { userApiService } from './userApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BookmarkResponse {
  success: boolean;
  bookmarks?: string[];
  error?: string;
}

class BookmarkService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  /**
   * Get stored hashed password for authentication
   */
  private async getHashedPassword(): Promise<string | null> {
    return await userApiService.getStoredHashedPassword();
  }

  /**
   * Get current user data
   */
  private async getCurrentUser(): Promise<any> {
    const userData = await AsyncStorage.getItem('@user_data');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Update user bookmarks via PUT /user endpoint
   * Requires email and hashed password for authentication
   */
  private async updateUserCards(cards: string[]): Promise<boolean> {
    try {
      const hashedPassword = await this.getHashedPassword();
      const currentUser = await this.getCurrentUser();

      if (!hashedPassword) {
        console.error('[BookmarkService] No hashed password found');
        return false;
      }

      if (!currentUser || !currentUser.email) {
        console.error('[BookmarkService] No user data found');
        return false;
      }

      // Prepare user data for PUT /user
      const userData = {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        password: hashedPassword,
        cards: cards
      };

      const url = `${this.baseUrl}/user`;
      console.log('[BookmarkService] PUT /user with cards:', cards.length);

      const response = await fetchWithTimeout(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorHeader = response.headers.get('X-Error');
        console.error('[BookmarkService] Update user failed:', response.status, errorHeader);
        return false;
      }

      console.log('[BookmarkService] Update user success');
      return true;
    } catch (error) {
      console.error('[BookmarkService] Update user error:', error);
      return false;
    }
  }

  /**
   * Add a company to user's bookmarks
   * Uses PUT /user to update cards array
   * @param userId User ID (not used, kept for compatibility)
   * @param companyId Company ID to bookmark
   * @returns Promise resolving to success status
   */
  async addBookmark(userId: string, companyId: string): Promise<boolean> {
    try {
      console.log('[BookmarkService] Adding bookmark:', companyId);
      
      // Get current bookmarks from local storage
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.error('[BookmarkService] No user data found');
        return false;
      }

      const currentCards = currentUser.cards || [];
      
      // Check if already bookmarked
      if (currentCards.includes(companyId)) {
        console.log('[BookmarkService] Company already bookmarked');
        return true;
      }

      // Add new bookmark
      const updatedCards = [...currentCards, companyId];
      
      // Update via PUT /user
      const success = await this.updateUserCards(updatedCards);
      
      if (success) {
        // Update local user data
        currentUser.cards = updatedCards;
        await AsyncStorage.setItem('@user_data', JSON.stringify(currentUser));
        console.log('[BookmarkService] Add bookmark success');
      }
      
      return success;
    } catch (error) {
      console.error('[BookmarkService] Add bookmark error:', error);
      return false;
    }
  }

  /**
   * Remove a company from user's bookmarks
   * Uses PUT /user to update cards array
   * @param userId User ID (not used, kept for compatibility)
   * @param companyId Company ID to remove
   * @returns Promise resolving to success status
   */
  async removeBookmark(userId: string, companyId: string): Promise<boolean> {
    try {
      console.log('[BookmarkService] Removing bookmark:', companyId);
      
      // Get current bookmarks from local storage
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.error('[BookmarkService] No user data found');
        return false;
      }

      const currentCards = currentUser.cards || [];
      
      // Remove bookmark
      const updatedCards = currentCards.filter((id: string) => id !== companyId);
      
      // Update via PUT /user
      const success = await this.updateUserCards(updatedCards);
      
      if (success) {
        // Update local user data
        currentUser.cards = updatedCards;
        await AsyncStorage.setItem('@user_data', JSON.stringify(currentUser));
        console.log('[BookmarkService] Remove bookmark success');
      }
      
      return success;
    } catch (error) {
      console.error('[BookmarkService] Remove bookmark error:', error);
      return false;
    }
  }

  /**
   * Fetch all bookmarks for a user
   * Returns bookmarks from local user data (cards array)
   * @param userId User ID (not used, kept for compatibility)
   * @returns Promise resolving to array of company IDs
   */
  async fetchBookmarks(userId: string): Promise<string[]> {
    try {
      console.log('[BookmarkService] Fetching bookmarks');
      
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.error('[BookmarkService] No user data found');
        return [];
      }

      const bookmarks = currentUser.cards || [];
      console.log('[BookmarkService] Fetch bookmarks success, count:', bookmarks.length);
      return bookmarks;
    } catch (error) {
      console.error('[BookmarkService] Fetch bookmarks error:', error);
      return [];
    }
  }

  /**
   * Sync bookmarks with backend (batch update)
   * Used for offline sync when user comes back online
   * Uses PUT /user to update cards array
   * @param userId User ID (not used, kept for compatibility)
   * @param bookmarks Array of company IDs to sync
   * @returns Promise resolving to success status
   */
  async syncBookmarks(userId: string, bookmarks: string[]): Promise<boolean> {
    try {
      console.log('[BookmarkService] Syncing bookmarks, count:', bookmarks.length);
      
      // Update via PUT /user
      const success = await this.updateUserCards(bookmarks);
      
      if (success) {
        // Update local user data
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
          currentUser.cards = bookmarks;
          await AsyncStorage.setItem('@user_data', JSON.stringify(currentUser));
          console.log('[BookmarkService] Sync bookmarks success');
        }
      }
      
      return success;
    } catch (error) {
      console.error('[BookmarkService] Sync bookmarks error:', error);
      return false;
    }
  }
}

export default new BookmarkService();


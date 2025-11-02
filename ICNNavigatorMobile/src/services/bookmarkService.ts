/**
 * Bookmark Service
 * Handles all bookmark-related API calls to the backend
 * Uses PUT /user to update user.cards array with hashed password authentication
 */

import { getApiBaseUrl, fetchWithTimeout, API_CONFIG, HttpMethod } from './apiConfig';
import { userApiService, UserFull } from './userApiService';
import { normalizeEmail } from '../utils/emailNormalizer';
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
   * Uses userApiService.updateUser with stored hashed password
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

      // Ensure cards is an array (organization IDs added to List)
      const safeCards = Array.isArray(cards) ? cards : [];
      
      // Use userApiService.updateUser with stored hashed password
      const userData = {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        password: hashedPassword, // Pass the stored hashed password
        cards: safeCards
      };

      console.log('[BookmarkService] Updating user with organization IDs:', safeCards.length, safeCards);

      const response = await userApiService.updateUser(userData);

      if (response.success) {
        console.log('[BookmarkService] Update user success');
        return true;
      } else {
        console.error('[BookmarkService] Update user failed:', response.error);
        return false;
      }
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
      
      // If already exists, keep original array; otherwise add
      const updatedCards = currentCards.includes(companyId) 
        ? currentCards 
        : [...currentCards, companyId];
      
      // Always call API to sync to backend
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
   * Fetch user data from backend API to get latest bookmarks
   * Uses stored email and hashed password to authenticate
   * Uses POST /api/user endpoint (same as login endpoint) to get latest user data
   * @returns Promise resolving to UserFull object or null
   */
  private async fetchUserDataFromBackend(): Promise<UserFull | null> {
    try {
      const currentUser = await this.getCurrentUser();
      const hashedPassword = await this.getHashedPassword();

      if (!currentUser || !currentUser.email) {
        console.error('[BookmarkService] No user data found');
        return null;
      }

      if (!hashedPassword) {
        console.error('[BookmarkService] No hashed password found');
        return null;
      }

      // Use POST /api/user endpoint with stored credentials to get latest user data
      // This is the same endpoint as login, but we use already-hashed password
      // Normalize email to ensure consistent format with login
      const normalizedEmail = normalizeEmail(currentUser.email);
      const params = new URLSearchParams({
        email: normalizedEmail,
        password: hashedPassword.toLowerCase() // Ensure lowercase for backend compatibility
      });
      const endpoint = `/user?${params.toString()}`;

      // Build full URL with /api prefix
      const apiBaseUrl = API_CONFIG[__DEV__ ? 'DEV' : 'PROD'].BASE_URL;
      const fullUrl = `${apiBaseUrl}${endpoint}`;

      console.log('[BookmarkService] Fetching user data from backend:', fullUrl);

      const response = await fetchWithTimeout(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('[BookmarkService] Failed to fetch user data from backend:', response.status);
        return null;
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error('[BookmarkService] Error fetching user data from backend:', error);
      return null;
    }
  }

  /**
   * Extract bookmark IDs from user data
   * Supports both organisationCards array and cards array formats
   * @param userData User data object
   * @returns Array of organization IDs
   */
  private extractBookmarkIds(userData: any): string[] {
    // Priority 1: Extract from organisationCards (backend field)
    if (userData.organisationCards && Array.isArray(userData.organisationCards)) {
      return userData.organisationCards
        .map((card: any) => {
          if (typeof card === 'string') {
            return card;
          }
          return card.id || card._id;
        })
        .filter((id: any): id is string => id !== undefined && id !== null);
    }

    // Priority 2: Extract from cards field (backward compatibility)
    if (userData.cards && Array.isArray(userData.cards)) {
      return userData.cards
        .map((card: any) => {
          if (typeof card === 'string') {
            return card;
          }
          return card.id || card._id;
        })
        .filter((id: any): id is string => id !== undefined && id !== null);
    }

    return [];
  }

  /**
   * Fetch all bookmarks for a user
   * Fetches latest bookmarks from backend API, falls back to local storage if API fails
   * @param userId User ID (not used, kept for compatibility)
   * @returns Promise resolving to array of company IDs
   */
  async fetchBookmarks(userId: string): Promise<string[]> {
    try {
      console.log('[BookmarkService] Fetching bookmarks from backend...');

      // Try to fetch latest data from backend API
      const backendUserData = await this.fetchUserDataFromBackend();

      if (backendUserData) {
        // Extract bookmarks from backend response
        const bookmarks = this.extractBookmarkIds(backendUserData);
        console.log('[BookmarkService] Fetched bookmarks from backend, count:', bookmarks.length);

        // Update local storage with latest data to keep in sync
        const currentUser = await this.getCurrentUser();
        if (currentUser) {
          currentUser.cards = bookmarks;
          await AsyncStorage.setItem('@user_data', JSON.stringify(currentUser));
          console.log('[BookmarkService] Updated local storage with backend bookmarks');
        }

        return bookmarks;
      }

      // Fallback to local storage if backend fetch fails
      console.log('[BookmarkService] Backend fetch failed, falling back to local storage');
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.error('[BookmarkService] No user data found');
        return [];
      }

      const bookmarks = currentUser.cards || [];
      console.log('[BookmarkService] Fetch bookmarks from local storage, count:', bookmarks.length);
      return bookmarks;
    } catch (error) {
      console.error('[BookmarkService] Fetch bookmarks error:', error);
      // Fallback to local storage on error
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return [];
      }
      return currentUser.cards || [];
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


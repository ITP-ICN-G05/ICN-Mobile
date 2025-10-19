/**
 * Bookmark Service
 * Handles all bookmark-related API calls to the backend
 */

import { getApiBaseUrl, fetchWithTimeout } from './apiConfig';

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
   * Add a company to user's bookmarks
   * @param userId User ID
   * @param companyId Company ID to bookmark
   * @returns Promise resolving to success status
   */
  async addBookmark(userId: string, companyId: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/user/bookmarks/add?userId=${encodeURIComponent(userId)}&companyId=${encodeURIComponent(companyId)}`;
      console.log('[BookmarkService] POST addBookmark:', url);
      
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[BookmarkService] addBookmark response status:', response.status);

      if (!response.ok) {
        const errorHeader = response.headers.get('X-Error');
        const responseText = await response.text();
        console.error('[BookmarkService] Add bookmark failed:', {
          status: response.status,
          statusText: response.statusText,
          errorHeader,
          responseBody: responseText
        });
        return false;
      }

      console.log('[BookmarkService] Add bookmark success');
      return true;
    } catch (error) {
      console.error('[BookmarkService] Add bookmark error:', error);
      if (error instanceof Error) {
        console.error('[BookmarkService] Error details:', error.message, error.stack);
      }
      return false;
    }
  }

  /**
   * Remove a company from user's bookmarks
   * @param userId User ID
   * @param companyId Company ID to remove
   * @returns Promise resolving to success status
   */
  async removeBookmark(userId: string, companyId: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/user/bookmarks/remove?userId=${encodeURIComponent(userId)}&companyId=${encodeURIComponent(companyId)}`;
      console.log('[BookmarkService] POST removeBookmark:', url);
      
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[BookmarkService] removeBookmark response status:', response.status);

      if (!response.ok) {
        const errorHeader = response.headers.get('X-Error');
        const responseText = await response.text();
        console.error('[BookmarkService] Remove bookmark failed:', {
          status: response.status,
          statusText: response.statusText,
          errorHeader,
          responseBody: responseText
        });
        return false;
      }

      console.log('[BookmarkService] Remove bookmark success');
      return true;
    } catch (error) {
      console.error('[BookmarkService] Remove bookmark error:', error);
      if (error instanceof Error) {
        console.error('[BookmarkService] Error details:', error.message, error.stack);
      }
      return false;
    }
  }

  /**
   * Fetch all bookmarks for a user
   * @param userId User ID
   * @returns Promise resolving to array of company IDs
   */
  async fetchBookmarks(userId: string): Promise<string[]> {
    try {
      const url = `${this.baseUrl}/user/bookmarks?userId=${encodeURIComponent(userId)}`;
      console.log('[BookmarkService] GET fetchBookmarks:', url);
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[BookmarkService] fetchBookmarks response status:', response.status);

      if (!response.ok) {
        const errorHeader = response.headers.get('X-Error');
        const responseText = await response.text();
        console.error('[BookmarkService] Fetch bookmarks failed:', {
          status: response.status,
          statusText: response.statusText,
          errorHeader,
          responseBody: responseText
        });
        return [];
      }

      const bookmarks: string[] = await response.json();
      console.log('[BookmarkService] Fetch bookmarks success, count:', bookmarks?.length || 0);
      return bookmarks || [];
    } catch (error) {
      console.error('[BookmarkService] Fetch bookmarks error:', error);
      if (error instanceof Error) {
        console.error('[BookmarkService] Error details:', error.message, error.stack);
      }
      return [];
    }
  }

  /**
   * Sync bookmarks with backend (batch update)
   * Used for offline sync when user comes back online
   * @param userId User ID
   * @param bookmarks Array of company IDs to sync
   * @returns Promise resolving to success status
   */
  async syncBookmarks(userId: string, bookmarks: string[]): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/user/bookmarks/sync?userId=${encodeURIComponent(userId)}`;
      console.log('[BookmarkService] POST syncBookmarks:', url, 'count:', bookmarks.length);
      
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookmarks),
      });

      console.log('[BookmarkService] syncBookmarks response status:', response.status);

      if (!response.ok) {
        const errorHeader = response.headers.get('X-Error');
        const responseText = await response.text();
        console.error('[BookmarkService] Sync bookmarks failed:', {
          status: response.status,
          statusText: response.statusText,
          errorHeader,
          responseBody: responseText
        });
        return false;
      }

      console.log('[BookmarkService] Sync bookmarks success');
      return true;
    } catch (error) {
      console.error('[BookmarkService] Sync bookmarks error:', error);
      if (error instanceof Error) {
        console.error('[BookmarkService] Error details:', error.message, error.stack);
      }
      return false;
    }
  }
}

export default new BookmarkService();


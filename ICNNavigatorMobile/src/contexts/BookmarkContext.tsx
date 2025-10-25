import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bookmarkService from '../services/bookmarkService';
import { useUser } from './UserContext';
import { useUserTier } from './UserTierContext';

/**
 * BookmarkContext
 * Global state management for company bookmarks with:
 * - Local persistence via AsyncStorage
 * - Backend synchronization
 * - Offline support with pending operations queue
 * - Tier-based limitations
 */

interface PendingOperation {
  type: 'add' | 'remove';
  companyId: string;
  timestamp: number;
}

interface BookmarkContextType {
  bookmarkedIds: string[];
  isBookmarked: (companyId: string) => boolean;
  addBookmark: (companyId: string) => Promise<void>;
  removeBookmark: (companyId: string) => Promise<void>;
  toggleBookmark: (companyId: string) => Promise<void>;
  syncWithBackend: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY = '@bookmarked_companies';
const PENDING_OPS_KEY = '@pending_bookmark_operations';

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useUser();
  const { currentTier, features } = useUserTier();
  
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bookmarks from AsyncStorage on mount
  useEffect(() => {
    loadBookmarks();
  }, []);

  // Sync with backend when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      syncWithBackend();
    }
  }, [isAuthenticated, user?.id]);

  /**
   * Load bookmarks from AsyncStorage
   */
  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const storedPending = await AsyncStorage.getItem(PENDING_OPS_KEY);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setBookmarkedIds(parsed);
        console.log('[BookmarkContext] Loaded bookmarks from storage:', parsed.length);
      }

      if (storedPending) {
        const parsed = JSON.parse(storedPending);
        setPendingOperations(parsed);
        console.log('[BookmarkContext] Loaded pending operations:', parsed.length);
      }
    } catch (error) {
      // console.error('[BookmarkContext] Failed to load bookmarks:', error);
    }
  };

  /**
   * Save bookmarks to AsyncStorage
   */
  const saveBookmarks = async (bookmarks: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
      console.log('[BookmarkContext] Saved bookmarks to storage:', bookmarks.length);
    } catch (error) {
      // console.error('[BookmarkContext] Failed to save bookmarks:', error);
    }
  };

  /**
   * Save pending operations to AsyncStorage
   */
  const savePendingOperations = async (operations: PendingOperation[]) => {
    try {
      await AsyncStorage.setItem(PENDING_OPS_KEY, JSON.stringify(operations));
      console.log('[BookmarkContext] Saved pending operations:', operations.length);
    } catch (error) {
      // console.error('[BookmarkContext] Failed to save pending operations:', error);
    }
  };

  /**
   * Check if a company is bookmarked
   */
  const isBookmarked = useCallback((companyId: string): boolean => {
    return bookmarkedIds.includes(companyId);
  }, [bookmarkedIds]);

  /**
   * Check tier limits before adding bookmark
   */
  const checkTierLimit = (): boolean => {
    if (currentTier === 'free' && bookmarkedIds.length >= 10) {
      setError('Free tier allows maximum 10 bookmarks. Upgrade to save more.');
      return false;
    }
    return true;
  };

  /**
   * Add a bookmark
   */
  const addBookmark = async (companyId: string) => {
    if (!companyId) {
      // console.warn('[BookmarkContext] Invalid company ID');
      return;
    }

    // Check if already bookmarked
    if (isBookmarked(companyId)) {
      console.log('[BookmarkContext] Company already bookmarked:', companyId);
      return;
    }

    // Check tier limit
    if (!checkTierLimit()) {
      return;
    }

    // Optimistic update - update local state immediately
    const updatedBookmarks = [...bookmarkedIds, companyId];
    setBookmarkedIds(updatedBookmarks);
    await saveBookmarks(updatedBookmarks);

    // Try to sync with backend
    if (isAuthenticated && user?.id) {
      try {
        const success = await bookmarkService.addBookmark(user.id, companyId);
        if (success) {
          console.log('[BookmarkContext] Successfully added bookmark to backend:', companyId);
        } else {
          // Add to pending operations if backend fails
          await addPendingOperation('add', companyId);
        }
      } catch (error) {
        // console.error('[BookmarkContext] Failed to add bookmark to backend:', error);
        // Add to pending operations for later sync
        await addPendingOperation('add', companyId);
      }
    } else {
      // User not authenticated, add to pending operations
      await addPendingOperation('add', companyId);
    }
  };

  /**
   * Remove a bookmark
   */
  const removeBookmark = async (companyId: string) => {
    if (!companyId) {
      // console.warn('[BookmarkContext] Invalid company ID');
      return;
    }

    // Optimistic update - update local state immediately
    const updatedBookmarks = bookmarkedIds.filter(id => id !== companyId);
    setBookmarkedIds(updatedBookmarks);
    await saveBookmarks(updatedBookmarks);

    // Try to sync with backend
    if (isAuthenticated && user?.id) {
      try {
        const success = await bookmarkService.removeBookmark(user.id, companyId);
        if (success) {
          console.log('[BookmarkContext] Successfully removed bookmark from backend:', companyId);
        } else {
          // Add to pending operations if backend fails
          await addPendingOperation('remove', companyId);
        }
      } catch (error) {
        // console.error('[BookmarkContext] Failed to remove bookmark from backend:', error);
        // Add to pending operations for later sync
        await addPendingOperation('remove', companyId);
      }
    } else {
      // User not authenticated, add to pending operations
      await addPendingOperation('remove', companyId);
    }
  };

  /**
   * Toggle bookmark state
   */
  const toggleBookmark = async (companyId: string) => {
    if (isBookmarked(companyId)) {
      await removeBookmark(companyId);
    } else {
      await addBookmark(companyId);
    }
  };

  /**
   * Add operation to pending queue
   */
  const addPendingOperation = async (type: 'add' | 'remove', companyId: string) => {
    const newOp: PendingOperation = {
      type,
      companyId,
      timestamp: Date.now(),
    };

    const updatedOps = [...pendingOperations, newOp];
    setPendingOperations(updatedOps);
    await savePendingOperations(updatedOps);
    console.log('[BookmarkContext] Added pending operation:', newOp);
  };

  /**
   * Sync bookmarks with backend
   * - Fetches backend bookmarks
   * - Merges with local bookmarks (union)
   * - Applies pending operations
   * - Updates backend with final state
   * - PRESERVES local bookmarks if backend fails
   */
  const syncWithBackend = async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('[BookmarkContext] Cannot sync: user not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[BookmarkContext] Starting sync with backend...');
      console.log('[BookmarkContext] Local bookmarks before sync:', bookmarkedIds.length);

      // Fetch backend bookmarks
      const backendBookmarks = await bookmarkService.fetchBookmarks(user.id);
      console.log('[BookmarkContext] Backend bookmarks:', backendBookmarks.length);

      // If backend fetch failed (returns empty array), keep local bookmarks and retry later
      if (backendBookmarks.length === 0 && bookmarkedIds.length > 0) {
        // console.warn('[BookmarkContext] Backend returned no bookmarks, preserving local bookmarks');
        // Try to push local bookmarks to backend
        const pushSuccess = await bookmarkService.syncBookmarks(user.id, bookmarkedIds);
        if (pushSuccess) {
          console.log('[BookmarkContext] Successfully pushed local bookmarks to backend');
          // Clear pending operations since we synced
          setPendingOperations([]);
          await savePendingOperations([]);
        } else {
          // console.warn('[BookmarkContext] Failed to push local bookmarks, will retry later');
          setError('Backend sync failed, bookmarks saved locally');
        }
        setIsLoading(false);
        return;
      }

      // Merge local and backend bookmarks (union)
      const mergedBookmarks = Array.from(new Set([...bookmarkedIds, ...backendBookmarks]));
      console.log('[BookmarkContext] Merged bookmarks:', mergedBookmarks.length);

      // Apply pending operations to merged set
      let finalBookmarks = [...mergedBookmarks];
      for (const op of pendingOperations) {
        if (op.type === 'add' && !finalBookmarks.includes(op.companyId)) {
          finalBookmarks.push(op.companyId);
        } else if (op.type === 'remove') {
          finalBookmarks = finalBookmarks.filter(id => id !== op.companyId);
        }
      }

      console.log('[BookmarkContext] Final bookmarks after pending ops:', finalBookmarks.length);

      // Update backend with final state
      const syncSuccess = await bookmarkService.syncBookmarks(user.id, finalBookmarks);
      
      if (syncSuccess) {
        // Update local state
        setBookmarkedIds(finalBookmarks);
        await saveBookmarks(finalBookmarks);

        // Clear pending operations
        setPendingOperations([]);
        await savePendingOperations([]);

        console.log('[BookmarkContext] Sync completed successfully');
      } else {
        // Don't update local state if backend sync failed
        setError('Failed to sync bookmarks with backend, kept local bookmarks');
        // console.error('[BookmarkContext] Sync failed, preserving local bookmarks');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMsg);
      // console.error('[BookmarkContext] Sync error:', errorMsg);
      // Don't clear local bookmarks on error
    } finally {
      setIsLoading(false);
    }
  };

  const value: BookmarkContextType = {
    bookmarkedIds,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    syncWithBackend,
    isLoading,
    error,
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};

/**
 * Hook to use bookmark context
 */
export const useBookmark = (): BookmarkContextType => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmark must be used within BookmarkProvider');
  }
  return context;
};


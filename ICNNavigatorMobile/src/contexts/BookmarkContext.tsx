import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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

const PENDING_OPS_KEY = '@pending_bookmark_operations';

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useUser();
  const { currentTier, features } = useUserTier();
  
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false); // Sync lock to prevent concurrent syncs
  
  // Track if initial sync has been performed after login to prevent duplicate syncs
  const hasPerformedInitialSync = useRef(false);

  // Load bookmarks from AsyncStorage on mount
  useEffect(() => {
    loadBookmarks();
  }, []);

  // Sync with backend when user logs in (only once per login session)
  useEffect(() => {
    if (isAuthenticated && user?.id && !hasPerformedInitialSync.current) {
      // Mark that we're about to perform initial sync
      hasPerformedInitialSync.current = true;
      
      // Delay sync to ensure saveUserData() has completed
      // This prevents race condition between login and bookmark sync
      const syncTimeout = setTimeout(() => {
        if (!isSyncing) { // Check sync lock
          syncWithBackend();
        } else {
          console.log('[BookmarkContext] Sync already in progress, skipping initial sync');
        }
      }, 500); // 500ms delay to ensure user data is fully saved
      
      return () => clearTimeout(syncTimeout);
    }
  }, [isAuthenticated, user?.id]); // Removed isSyncing from dependencies to break the loop

  // Reset initial sync flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hasPerformedInitialSync.current = false;
    }
  }, [isAuthenticated]);

  /**
   * Migrate bookmark IDs from old format to new format
   * Old format: "unknown_n70bjv_100" (combination ID)
   * New format: "0010n00000De6f9" (organization ID)
   */
  const migrateBookmarkIds = async (bookmarks: string[]): Promise<string[]> => {
    const migratedBookmarks: string[] = [];
    let migrationCount = 0;

    for (const bookmarkId of bookmarks) {
      // Check if this is an old format ID (contains underscore and hash)
      if (bookmarkId.includes('_') && bookmarkId.length > 20) {
        // Extract organization ID from the combination ID
        // Format: "orgId_hash_index" -> extract "orgId"
        const parts = bookmarkId.split('_');
        if (parts.length >= 3) {
          const orgId = parts[0];
          // Only migrate if orgId is not "unknown"
          if (orgId !== 'unknown') {
            migratedBookmarks.push(orgId);
            migrationCount++;
            console.log(`[BookmarkContext] Migrated bookmark: ${bookmarkId} -> ${orgId}`);
          } else {
            // Keep original ID if organization ID is unknown
            migratedBookmarks.push(bookmarkId);
            console.log(`[BookmarkContext] Kept unknown bookmark ID: ${bookmarkId}`);
          }
        } else {
          // Keep original ID if format is unexpected
          migratedBookmarks.push(bookmarkId);
        }
      } else {
        // Already in correct format, keep as is
        migratedBookmarks.push(bookmarkId);
      }
    }

    if (migrationCount > 0) {
      console.log(`[BookmarkContext] Migration completed: ${migrationCount} bookmarks migrated`);
    }

    return migratedBookmarks;
  };

  /**
   * Load bookmarks from AsyncStorage
   */
  const loadBookmarks = async () => {
    try {
      const storedPending = await AsyncStorage.getItem(PENDING_OPS_KEY);
      
      // Load bookmarks from user data instead of separate storage
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        const rawBookmarks = parsed.cards || [];
        
        // Migrate bookmark IDs if needed
        const migratedBookmarks = await migrateBookmarkIds(rawBookmarks);
        
        // Update user data with migrated bookmarks if changes were made
        if (migratedBookmarks.length !== rawBookmarks.length || 
            !migratedBookmarks.every((id, index) => id === rawBookmarks[index])) {
          parsed.cards = migratedBookmarks;
          await AsyncStorage.setItem('@user_data', JSON.stringify(parsed));
          console.log('[BookmarkContext] Updated user data with migrated bookmarks');
        }
        
        setBookmarkedIds(migratedBookmarks);
        console.log('[BookmarkContext] Loaded bookmarks from user data:', migratedBookmarks.length);
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
      // Update user data with new bookmarks
      const userData = await AsyncStorage.getItem('@user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.cards = bookmarks;
        await AsyncStorage.setItem('@user_data', JSON.stringify(parsed));
        console.log('[BookmarkContext] Saved bookmarks to user data:', bookmarks.length);
      }
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

    // Wait for any ongoing sync to complete before adding bookmark
    if (isSyncing) {
      console.log('[BookmarkContext] Sync in progress, queuing bookmark add operation');
      await addPendingOperation('add', companyId);
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
          // Trigger sync to handle pending operations
          if (!isSyncing) {
            syncWithBackend();
          }
        }
      } catch (error) {
        // console.error('[BookmarkContext] Failed to add bookmark to backend:', error);
        // Add to pending operations for later sync
        await addPendingOperation('add', companyId);
        // Trigger sync to handle pending operations
        if (!isSyncing) {
          syncWithBackend();
        }
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

    // Wait for any ongoing sync to complete before removing bookmark
    if (isSyncing) {
      console.log('[BookmarkContext] Sync in progress, queuing bookmark remove operation');
      await addPendingOperation('remove', companyId);
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
          // Trigger sync to handle pending operations
          if (!isSyncing) {
            syncWithBackend();
          }
        }
      } catch (error) {
        // console.error('[BookmarkContext] Failed to remove bookmark from backend:', error);
        // Add to pending operations for later sync
        await addPendingOperation('remove', companyId);
        // Trigger sync to handle pending operations
        if (!isSyncing) {
          syncWithBackend();
        }
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

    // Check if sync is already in progress
    if (isSyncing) {
      console.log('[BookmarkContext] Sync already in progress, skipping duplicate request');
      return;
    }

    setIsSyncing(true); // Acquire sync lock
    setIsLoading(true);
    setError(null);

    try {
      console.log('[BookmarkContext] 🔄 Starting sync with backend...');
      console.log('[BookmarkContext] 📊 Local bookmarks before sync:', bookmarkedIds.length);
      console.log('[BookmarkContext] 🔒 Sync lock acquired, preventing concurrent operations');

      // Fetch backend bookmarks
      const backendBookmarks = await bookmarkService.fetchBookmarks(user.id);
      console.log('[BookmarkContext] Backend bookmarks:', backendBookmarks.length);

      // If backend fetch failed (returns empty array), keep local bookmarks and retry later
      if (backendBookmarks.length === 0 && bookmarkedIds.length > 0) {
        console.log('[BookmarkContext] Backend returned no bookmarks, pushing local bookmarks to backend');
        // Try to push local bookmarks to backend
        const pushSuccess = await bookmarkService.syncBookmarks(user.id, bookmarkedIds);
        if (pushSuccess) {
          console.log('[BookmarkContext] Successfully pushed local bookmarks to backend');
          // Clear pending operations since we synced
          setPendingOperations([]);
          await savePendingOperations([]);
        } else {
          console.warn('[BookmarkContext] Failed to push local bookmarks, will retry later');
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

      // Check if we need to update backend (if there are changes)
      const needsBackendUpdate = finalBookmarks.length !== backendBookmarks.length || 
        !finalBookmarks.every(id => backendBookmarks.includes(id));
      
      if (needsBackendUpdate) {
        console.log('[BookmarkContext] Changes detected, updating backend...');
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
          console.error('[BookmarkContext] Sync failed, preserving local bookmarks');
        }
      } else {
        console.log('[BookmarkContext] No changes needed, local state updated to match backend');
        // Update local state to match backend
        setBookmarkedIds(finalBookmarks);
        await saveBookmarks(finalBookmarks);
        
        // Clear pending operations
        setPendingOperations([]);
        await savePendingOperations([]);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMsg);
      // console.error('[BookmarkContext] Sync error:', errorMsg);
      // Don't clear local bookmarks on error
    } finally {
      setIsLoading(false);
      setIsSyncing(false); // Release sync lock
      console.log('[BookmarkContext] 🔓 Sync lock released, operations can resume');
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


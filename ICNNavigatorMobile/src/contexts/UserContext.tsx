import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/authService';
import { userApiService } from '../services/userApiService';
import { PasswordHasher } from '../utils/passwordHasher';
import { debugEmail } from '../utils/emailNormalizer';

/**
 * UserContext
 * 
 * Responsibility: Manages basic user data and backend synchronization
 * - Handles authentication state and user login/logout
 * - Manages basic user fields (name, email, phone, company, role)
 * - Handles backend sync for basic fields with proper password authentication
 * - Does NOT handle extended profile fields (bio, linkedIn, website, avatar)
 * 
 * Backend Sync Responsibility:
 * - All backend API calls for user data include the required password field
 * - ProfileContext handles extended fields and local storage only
 * - This prevents duplicate API calls and ensures proper authentication
 */

/**
 * Extract cards array from UserFull object
 * Supports two formats:
 * 1. cards: string[] - use directly
 * 2. organisationCards: OrganisationCard[] - extract _id
 */
const extractCardsFromUserFull = (userFull: any): string[] => {
  // Priority 1: Use organisationCards (actual backend field)
  if (userFull.organisationCards && Array.isArray(userFull.organisationCards)) {
    // If object array, extract id (prefer id over _id for backend compatibility)
    return userFull.organisationCards
      .map((card: any) => typeof card === 'string' ? card : (card.id || card._id))
      .filter(Boolean);
  }
  
  // Priority 2: Fallback to cards field
  if (userFull.cards && Array.isArray(userFull.cards)) {
    // Handle both string array and object array
    return userFull.cards
      .map((card: any) => typeof card === 'string' ? card : (card.id || card._id))
      .filter(Boolean);
  }
  
  return [];
};

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  memberSince: string;
  avatar: string | null;
  cards?: string[];  // Add bookmark field
}

interface UserContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  showOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserData>, currentPassword?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
  setShowOnboarding: (show: boolean) => void;
}

const MOCK_USER_DATA: UserData = {
  id: '1',
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '+61 400 123 456',
  company: 'ABC Construction',
  role: 'Project Manager',
  memberSince: '2025',
  avatar: null,
};

const USE_BACKEND = true; // Set to true when backend is ready

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Derived authentication state
  const isAuthenticated = !!user;

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check for existing auth token
      const token = await AsyncStorage.getItem('@auth_token');
      const cachedUser = await AsyncStorage.getItem('@user_data');
      
      if (token && cachedUser) {
        setUser(JSON.parse(cachedUser));
        
        // Don't show onboarding on app restart - only on fresh login
        // The onboarding flag will be checked only in the login() function
        
        // Optionally validate token with backend
        if (USE_BACKEND) {
          await validateToken(token);
        }
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      // Clear invalid session
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = async (token: string) => {
    try {
      // Use unified API configuration
      const { getApiBaseUrl } = await import('../services/apiConfig');
      const API_BASE_URL = getApiBaseUrl();
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token invalid');
      }

      const userData = await response.json();
      
      // Convert UserFull to UserData format
        const convertedUser: UserData = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          company: userData.company || '',
          role: userData.role || 'User',
          memberSince: userData.createdAt ? new Date(userData.createdAt).getFullYear().toString() : '2024',
          avatar: userData.avatar || null,
          cards: extractCardsFromUserFull(userData),  // Extract bookmark data
        };
      
      setUser(convertedUser);
      await AsyncStorage.setItem('@user_data', JSON.stringify(convertedUser));
    } catch (err) {
      console.warn('Token validation failed:', err);
      await logout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Debug email and password values
      console.log('🔍 UserContext - Login email:', email);
      console.log('🔍 UserContext - Password length:', password.length);
      debugEmail(email, 'UserContext Login Email');

      // Check if this is a different user logging in
      const lastUserEmail = await AsyncStorage.getItem('@last_user_email');
      const isDifferentUser = lastUserEmail && lastUserEmail !== email;
      
      if (isDifferentUser) {
        console.log('Different user detected, clearing all local data');
        // Clear all local data for different user
        await AsyncStorage.multiRemove([
          '@user_data',
          '@user_password_hash',
          '@last_user_email',
        ]);
      }

      if (USE_BACKEND) {
        // Use AuthService which calls the correct backend API
        const userFull = await AuthService.login(email, password);
        
        // Save token from backend response
        if (userFull.token) {
          await AsyncStorage.setItem('@auth_token', userFull.token);
        }
        if (userFull.refreshToken) {
          await AsyncStorage.setItem('@refresh_token', userFull.refreshToken);
        }
        
        // Convert UserFull to UserData format
        // IMPORTANT: Use login email as fallback if backend doesn't return it
        const convertedUser: UserData = {
          id: userFull.id,
          name: userFull.name,
          email: userFull.email || email, // Use login email as fallback
          phone: userFull.phone || '',
          company: userFull.company || '',
          role: userFull.role || 'User',
          memberSince: userFull.createdAt ? new Date(userFull.createdAt).getFullYear().toString() : '2025',
          avatar: userFull.avatar || null,
          cards: extractCardsFromUserFull(userFull),  // Extract bookmark data
        };
        
        // Store and set user data
        setUser(convertedUser);
        await AsyncStorage.setItem('@user_data', JSON.stringify(convertedUser));
        console.log('[UserContext] User data saved with organization IDs:', convertedUser.cards?.length || 0, convertedUser.cards);
        
        // Update last user email
        await AsyncStorage.setItem('@last_user_email', email);
        
        // Check if user has seen onboarding
        const onboardingCompleted = await AsyncStorage.getItem('@onboarding_completed');
        console.log('Onboarding check - completed status:', onboardingCompleted);
        if (onboardingCompleted !== 'true') {
          console.log('Setting showOnboarding to true');
          setShowOnboarding(true);
        } else {
          console.log('Onboarding already completed, not showing modal');
        }
        
        // Check for pending draft and auto-apply
        await applyPendingDraft();
      } else {
        // Mock authentication for development
        if (email && password) {
          const mockUser = { ...MOCK_USER_DATA, email };
          setUser(mockUser);
          await AsyncStorage.setItem('@auth_token', 'mock_token_123');
          await AsyncStorage.setItem('@user_data', JSON.stringify(mockUser));
          
          // Check if user has seen onboarding
          const onboardingCompleted = await AsyncStorage.getItem('@onboarding_completed');
          if (onboardingCompleted !== 'true') {
            setShowOnboarding(true);
          }
        } else {
          throw new Error('Invalid credentials');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Store current user email for smart re-login detection
      const currentUserEmail = user?.email;
      if (currentUserEmail) {
        await AsyncStorage.setItem('@last_user_email', currentUserEmail);
      }
      
      // Clear authentication tokens and settings, but keep user data temporarily
      await AsyncStorage.multiRemove([
        '@auth_token',
        '@refresh_token',
        '@user_settings',
        'userProfile',
      ]);
      
      // Clear state but keep user data in storage for potential re-login
      setUser(null);
      setError(null);
      
      // Optionally call backend logout endpoint
      if (USE_BACKEND) {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
          try {
            // Use unified API configuration
            const { getApiBaseUrl } = await import('../services/apiConfig');
            const API_BASE_URL = getApiBaseUrl();
            
            await fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
          } catch (err) {
            console.warn('Backend logout failed:', err);
          }
        }
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const updateUser = async (updates: Partial<UserData>, currentPassword?: string) => {
    if (!user) return;

    try {
      // 1. Prepare backend sync data (only name and email)
      const backendData: any = {
        id: user.id
      };
      
      if (updates.name !== undefined) backendData.name = updates.name;
      if (updates.email !== undefined) backendData.email = updates.email;
      
      // Automatically use stored hashed password, no user input required
      const storedHashedPassword = await userApiService.getStoredHashedPassword();
      if (storedHashedPassword) {
        backendData.password = storedHashedPassword;
      }
      
      // 2. Sync to backend (if there are updates and stored password is available)
      const hasBackendFields = updates.name !== undefined || updates.email !== undefined;
      if (hasBackendFields && storedHashedPassword) {
        try {
          const response = await userApiService.updateUser(backendData);
          if (!response.success) {
            console.warn('Backend sync failed, saving locally only:', response.error);
            // Continue with local update, don't block user operation
          } else {
            console.log('User data synced to backend successfully');
          }
        } catch (backendError) {
          console.warn('Backend sync error, saving locally only:', backendError);
          // Continue with local update, don't block user operation
        }
      } else if (hasBackendFields && !currentPassword) {
        console.log('Backend sync skipped - password required for name/email updates');
        // Continue with local update only
      }
      
      // 3. Update local data (all fields)
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUser));
      console.log('User data updated (backend + local)');
      
    } catch (err) {
      console.error('Failed to update user:', err);
      // Even if backend fails, update locally
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUser));
      setError(err instanceof Error ? err.message : 'Failed to update user');
      throw err;
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      if (USE_BACKEND) {
        const token = await AsyncStorage.getItem('@auth_token');
        if (!token) throw new Error('No auth token');

        // Use unified API configuration
        const { getApiBaseUrl } = await import('../services/apiConfig');
        const API_BASE_URL = getApiBaseUrl();

        const response = await fetchWithTimeout(`${API_BASE_URL}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch user data');

        const userData = await response.json();
        
        // Convert UserFull to UserData format
        const convertedUser: UserData = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          company: userData.company || '',
          role: userData.role || 'User',
          memberSince: userData.createdAt ? new Date(userData.createdAt).getFullYear().toString() : '2024',
          avatar: userData.avatar || null,
          cards: extractCardsFromUserFull(userData),  // Extract bookmark data
        };
        
        setUser(convertedUser);
        await AsyncStorage.setItem('@user_data', JSON.stringify(convertedUser));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh user');
    } finally {
      setIsLoading(false);
    }
  };

  const clearUser = () => {
    setUser(null);
    AsyncStorage.removeItem('@user_data');
  };

  const applyPendingDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem('@profile_draft');
      if (draft) {
        console.log('Found pending profile draft, applying...');
        const draftData = JSON.parse(draft);
        
        // Import profileApi at top of file
        const { profileApi } = await import('../services/profileApi');
        
        // Ensure we have user email for identification
        const userEmail = user?.email || draftData.email;
        if (!userEmail) {
          console.warn('Cannot apply profile draft: no user email available');
          return;
        }
        
        // Prepare update data with required email field
        const updateData = {
          email: userEmail, // Required for user identification
          ...(draftData.displayName && { displayName: draftData.displayName }),
          ...(draftData.phone && { phone: draftData.phone }),
          ...(draftData.company && { company: draftData.company }),
          ...(draftData.role && { role: draftData.role }),
          ...(draftData.bio && { bio: draftData.bio }),
          ...(draftData.linkedIn && { linkedIn: draftData.linkedIn }),
          ...(draftData.website && { website: draftData.website }),
          ...(draftData.memberSince && { memberSince: draftData.memberSince }),
        };
        
        // Apply the draft
        await profileApi.updateProfile(updateData);
        
        // Update local user state
        setUser(prev => prev ? {
          ...prev,
          name: draftData.displayName || prev.name,
          email: draftData.email || prev.email,
          phone: draftData.phone || prev.phone,
          company: draftData.company || prev.company,
          role: draftData.role || prev.role,
        } : null);
        
        // Clear the draft only after successful update
        await AsyncStorage.removeItem('@profile_draft');
        console.log('Profile draft applied successfully');
      }
    } catch (error) {
      console.warn('Failed to apply profile draft:', error);
      // Keep the draft for next login attempt instead of clearing it
      // Don't throw — let login succeed even if draft fails
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      isAuthenticated,
      isLoading, 
      error,
      showOnboarding,
      login,
      logout,
      updateUser, 
      refreshUser,
      clearUser,
      setShowOnboarding,
    }}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export { UserProvider, useUser };
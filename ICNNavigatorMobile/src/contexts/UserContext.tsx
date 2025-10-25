import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/authService';
import { userApiService } from '../services/userApiService';
import { PasswordHasher } from '../utils/passwordHasher';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  memberSince: string;
  avatar: string | null;
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
      const response = await fetchWithTimeout('https://api.icnvictoria.com/auth/validate', {
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
        };
        
        // Store and set user data
        setUser(convertedUser);
        await AsyncStorage.setItem('@user_data', JSON.stringify(convertedUser));
        
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
      // Clear all stored data
      await AsyncStorage.multiRemove([
        '@auth_token',
        '@refresh_token',
        '@user_data',
        '@user_settings',
        'userProfile',
      ]);
      
      // Clear state
      setUser(null);
      setError(null);
      
      // Optionally call backend logout endpoint
      if (USE_BACKEND) {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
          try {
            await fetchWithTimeout('https://api.icnvictoria.com/auth/logout', {
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
      // Hash the password before sending to backend
      if (currentPassword) {
        backendData.password = await PasswordHasher.hash(currentPassword);
      }
      
      // 2. Sync to backend (if there are updates and password is provided)
      const hasBackendFields = updates.name !== undefined || updates.email !== undefined;
      if (hasBackendFields && currentPassword) {
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

        const response = await fetchWithTimeout('https://api.icnvictoria.com/user/profile', {
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
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserData>) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
}

const MOCK_USER_DATA: UserData = {
  id: '1',
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '+61 400 123 456',
  company: 'ABC Construction',
  role: 'Project Manager',
  memberSince: '2024',
  avatar: null,
};

const USE_BACKEND = false; // Set to true when backend is ready

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      setUser(userData);
      await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
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
        // Backend authentication
        const response = await fetchWithTimeout('https://api.icnvictoria.com/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed');
        }

        const { token, refreshToken, user: userData } = await response.json();
        
        // Store tokens
        await AsyncStorage.setItem('@auth_token', token);
        if (refreshToken) {
          await AsyncStorage.setItem('@refresh_token', refreshToken);
        }
        
        // Store and set user data
        setUser(userData);
        await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
      } else {
        // Mock authentication for development
        if (email && password) {
          const mockUser = { ...MOCK_USER_DATA, email };
          setUser(mockUser);
          await AsyncStorage.setItem('@auth_token', 'mock_token_123');
          await AsyncStorage.setItem('@user_data', JSON.stringify(mockUser));
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

  const updateUser = async (updates: Partial<UserData>) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUser));

      if (USE_BACKEND) {
        const token = await AsyncStorage.getItem('@auth_token');
        if (!token) throw new Error('No auth token');

        try {
          await fetchWithTimeout('https://api.icnvictoria.com/user/profile', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });
        } catch (backendError) {
          console.warn('Failed to sync with backend, changes saved locally');
        }
      }
    } catch (err) {
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
        setUser(userData);
        await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      isAuthenticated,
      isLoading, 
      error,
      login,
      logout,
      updateUser, 
      refreshUser,
      clearUser 
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
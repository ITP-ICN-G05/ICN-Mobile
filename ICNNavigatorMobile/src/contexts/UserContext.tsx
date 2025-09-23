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
  isLoading: boolean;
  error: string | null;
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

const USE_BACKEND = false;

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const cachedUser = await AsyncStorage.getItem('@user_data');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
        setIsLoading(false);
        
        if (USE_BACKEND) {
          fetchFromBackend();
        }
        return;
      }

      if (USE_BACKEND) {
        await fetchFromBackend();
      } else {
        console.log('Using mock user data (backend not connected)');
        setUser(MOCK_USER_DATA);
        await AsyncStorage.setItem('@user_data', JSON.stringify(MOCK_USER_DATA));
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setUser(MOCK_USER_DATA);
      setError('Using offline data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFromBackend = async () => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (!token && USE_BACKEND) {
        throw new Error('No auth token');
      }

      const response = await fetchWithTimeout('https://api.icnvictoria.com/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }, 5000);

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      setUser(userData);
      await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
    } catch (err) {
      console.warn('Backend fetch failed, using cached/mock data:', err);
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
        try {
          await fetchWithTimeout('https://api.icnvictoria.com/user/profile', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          }, 5000);
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
    await fetchUserData();
  };

  const clearUser = () => {
    setUser(null);
    AsyncStorage.removeItem('@user_data');
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      isLoading, 
      error, 
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

// IMPORTANT: Export both named exports
export { UserProvider, useUser };
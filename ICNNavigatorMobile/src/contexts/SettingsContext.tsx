import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { useUser } from './UserContext';

interface Settings {
  notifications: boolean;
  locationServices: boolean;
  darkMode: boolean;
  autoSync: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: boolean) => Promise<void>;
  syncSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  notifications: true,
  locationServices: true,
  darkMode: false,
  autoSync: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useUser();
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from storage
  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('@user_settings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  // Save settings to storage and apply system changes
  const updateSetting = async (key: keyof Settings, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      // Persist to AsyncStorage
      await AsyncStorage.setItem('@user_settings', JSON.stringify(newSettings));

      // Sync with backend if authenticated
      if (isAuthenticated) {
        await syncSettingsToBackend(newSettings);
      }

      // Apply system-level changes
      await applySystemSettings(key, value);
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  };

  // Apply system-level settings
  const applySystemSettings = async (key: keyof Settings, value: boolean) => {
    switch (key) {
      case 'notifications':
        if (value) {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            throw new Error('Notification permission denied');
          }
        } else {
          // Disable notifications
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.NONE,
            sound: null,
          });
        }
        break;

      case 'locationServices':
        if (value) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            throw new Error('Location permission denied');
          }
        }
        break;

      case 'darkMode':
        // Emit event or update theme context
        // This would trigger app-wide theme change
        break;

      case 'autoSync':
        // Schedule or cancel background sync tasks
        break;
    }
  };

  // Sync settings with backend
  const syncSettingsToBackend = async (settings: Settings) => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (!token) return;

      await fetch('https://api.icnvictoria.com/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error('Failed to sync settings with backend:', error);
      // Don't throw - local settings are already updated
    }
  };

  // Sync settings from backend
  const syncSettings = async () => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (!token) return;

      const response = await fetch('https://api.icnvictoria.com/user/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const backendSettings = await response.json();
        const mergedSettings = { ...settings, ...backendSettings };
        setSettings(mergedSettings);
        await AsyncStorage.setItem('@user_settings', JSON.stringify(mergedSettings));
      }
    } catch (error) {
      console.error('Failed to sync settings from backend:', error);
    }
  };

  // Reset settings to defaults
  const resetSettings = async () => {
    setSettings(defaultSettings);
    await AsyncStorage.setItem('@user_settings', JSON.stringify(defaultSettings));
    
    if (isAuthenticated) {
      await syncSettingsToBackend(defaultSettings);
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    if (isAuthenticated) {
      syncSettings();
    }
  }, [isAuthenticated]);

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      syncSettings,
      resetSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

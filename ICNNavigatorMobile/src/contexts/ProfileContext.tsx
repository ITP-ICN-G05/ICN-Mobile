import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileApi, ProfileData } from '../services/profileApi';
import { useUser } from './UserContext';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  bio: string;
  linkedIn: string;
  website: string;
  avatar: string | null;
  memberSince: string;
}

interface UserSettings {
  notifications: boolean;
  locationServices: boolean;
  darkMode: boolean;
  autoSync: boolean;
}

interface ProfileContextType {
  profile: UserProfile | null;
  settings: UserSettings;
  loading: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<void>;
  deleteAvatar: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    notifications: true,
    locationServices: true,
    darkMode: false,
    autoSync: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only load profile if user is authenticated
    if (isAuthenticated && user) {
      loadProfile();
      loadSettings();
    } else {
      // Clear profile when user logs out
      setProfile(null);
      setSettings({
        notifications: true,
        locationServices: true,
        darkMode: false,
        autoSync: true,
      });
    }
  }, [isAuthenticated, user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Try to load from cache first for immediate display
      const cachedProfile = await AsyncStorage.getItem('userProfile');
      if (cachedProfile) {
        setProfile(JSON.parse(cachedProfile));
      }
      
      // Check for auth token
      const token = await AsyncStorage.getItem('@auth_token');
      if (!token) {
        console.warn('No auth token available');
        return;
      }
      
      // Then fetch from API - this now combines backend data with locally stored extended fields
      try {
        const profileData = await profileApi.getProfile();
        
        // profileData already contains the complete profile with both backend and extended fields
        const fullProfile: UserProfile = {
          id: profileData.id,
          displayName: profileData.displayName,
          email: profileData.email,
          phone: profileData.phone,
          company: profileData.company,
          role: profileData.role,
          bio: profileData.bio,
          linkedIn: profileData.linkedIn,
          website: profileData.website,
          avatar: profileData.avatar || null,
          memberSince: profileData.memberSince,
        };
        
        setProfile(fullProfile);
        await AsyncStorage.setItem('userProfile', JSON.stringify(fullProfile));
      } catch (apiError) {
        console.warn('Failed to fetch profile from API, using cached data', apiError);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // Load from local storage first
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      
      // Check for auth token before API call
      const token = await AsyncStorage.getItem('@auth_token');
      if (!token) return;
      
      // Then sync with server
      try {
        const serverSettings = await profileApi.getSettings();
        const mergedSettings = { ...settings, ...serverSettings };
        setSettings(mergedSettings);
        await AsyncStorage.setItem('userSettings', JSON.stringify(mergedSettings));
      } catch (apiError) {
        console.warn('Failed to sync settings with server');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      // Ensure email is included for user identification and handle avatar type correctly
      const updateData: Partial<{
        displayName?: string;
        email: string;
        phone?: string;
        company?: string;
        role?: string;
        bio?: string;
        linkedIn?: string;
        website?: string;
        avatar?: string;
        memberSince?: string;
      }> = {
        ...data,
        email: data.email || profile?.email || user?.email || '', // Required for identification
        avatar: data.avatar || undefined, // Convert null to undefined for type compatibility
      };
      
      // Use the updated profileApi which handles field mapping internally
      const updatedData = await profileApi.updateProfile(updateData);
      
      // Update local state with the returned data
      const updatedProfile: UserProfile = {
        ...profile!,
        ...updatedData,
        // Ensure we have an avatar value (null if not provided)
        avatar: updatedData.avatar || null,
      };
      
      setProfile(updatedProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Save locally immediately
      await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      
      // Sync with server if authenticated
      const token = await AsyncStorage.getItem('@auth_token');
      if (token) {
        try {
          await profileApi.updateSettings(newSettings);
        } catch (apiError) {
          console.warn('Failed to sync settings with server');
        }
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const uploadAvatar = async (uri: string) => {
    const formData = new FormData();
    formData.append('avatar', {
      uri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);
    
    const response = await profileApi.uploadAvatar(formData);
    
    if (profile) {
      const updatedProfile = { ...profile, avatar: response.avatarUrl };
      setProfile(updatedProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    }
  };

  const deleteAvatar = async () => {
    await profileApi.deleteAvatar();
    
    if (profile) {
      const updatedProfile = { ...profile, avatar: null };
      setProfile(updatedProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await profileApi.changePassword({ currentPassword, newPassword });
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        settings,
        loading,
        updateProfile,
        updateSettings,
        uploadAvatar,
        deleteAvatar,
        changePassword,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
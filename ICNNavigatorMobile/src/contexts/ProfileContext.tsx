import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileApi, ProfileData } from '../services/profileApi';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    notifications: true,
    locationServices: true,
    darkMode: false,
    autoSync: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadSettings();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Try to load from cache first
      const cachedProfile = await AsyncStorage.getItem('userProfile');
      if (cachedProfile) {
        setProfile(JSON.parse(cachedProfile));
      }
      
      // Then fetch from API
      const profileData = await profileApi.getProfile();
      
      // Convert ProfileData to UserProfile
      const fullProfile: UserProfile = {
        id: profileData.id,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
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
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Use cached data if API fails
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
      
      // Then sync with server
      const serverSettings = await profileApi.getSettings();
      const mergedSettings = { ...settings, ...serverSettings };
      setSettings(mergedSettings);
      await AsyncStorage.setItem('userSettings', JSON.stringify(mergedSettings));
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const updatedData = await profileApi.updateProfile({
        id: data.id || profile?.id || '',
        firstName: data.firstName || profile?.firstName || '',
        lastName: data.lastName || profile?.lastName || '',
        email: data.email || profile?.email || '',
        phone: data.phone || profile?.phone || '',
        company: data.company || profile?.company || '',
        role: data.role || profile?.role || '',
        bio: data.bio || profile?.bio || '',
        linkedIn: data.linkedIn || profile?.linkedIn || '',
        website: data.website || profile?.website || '',
        memberSince: data.memberSince || profile?.memberSince || '',
      });
      
      const updatedProfile: UserProfile = {
        ...profile!,
        ...updatedData,
        avatar: updatedData.avatar || null,
      };
      
      setProfile(updatedProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    } catch (error) {
      throw error;
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Save locally immediately
      await AsyncStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      
      // Sync with server
      await profileApi.updateSettings(newSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      // Settings are saved locally even if server sync fails
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
import { useState } from 'react';
import { Alert, Linking, Share, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useUser } from '@/contexts/UserContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserTier } from '@/contexts/UserTierContext';
import AuthService from '@/services/authService';
import DataExportService from '@/services/dataExportService';
import hybridDataService from '@/services/hybridDataService';
import { SettingsLoading } from '../types';

export const useProfileActions = () => {
  const navigation = useNavigation<any>();
  const { user, updateUser, clearUser, logout } = useUser();
  const { updateSetting } = useSettings();
  const { cancelSubscription } = useSubscription();
  const { currentTier, features } = useUserTier();

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState<SettingsLoading>({
    notifications: false,
    locationServices: false,
    darkMode: false,
    autoSync: false,
  });

  // Avatar Upload Functions
  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your avatar.');
      return;
    }

    setAvatarLoading(true);
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    setAvatarLoading(false);

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your camera to take a photo.');
      return;
    }

    setAvatarLoading(true);
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    setAvatarLoading(false);

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);
      
      const token = await AsyncStorage.getItem('@auth_token');
      const response = await fetch('https://api.icnvictoria.com/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const { avatarUrl } = await response.json();
        await updateUser({ avatar: avatarUrl });
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    }
  };

  const handleAvatarPress = () => {
    if (!user) return;
    
    Alert.alert(
      'Change Profile Picture',
      'Choose a method',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImageFromGallery },
        user.avatar && { 
          text: 'Remove Photo', 
          onPress: async () => await updateUser({ avatar: null }), 
          style: 'destructive' 
        },
        { text: 'Cancel', style: 'cancel' },
      ].filter(Boolean) as any,
      { cancelable: true }
    );
  };

  // Profile Management Handlers
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  // Subscription Management Handlers
  const handleUpgrade = () => {
    navigation.navigate('Payment');
  };

  const handleManageSubscription = () => {
    navigation.navigate('ManageSubscription');
  };

  const handleCancelSubscription = async () => {
    await cancelSubscription();
  };

  // Settings handlers with loading states
  const handleSettingChange = async (key: keyof SettingsLoading, value: boolean) => {
    setSettingsLoading(prev => ({ ...prev, [key]: true }));
    try {
      await updateSetting(key, value);
    } catch (error) {
      Alert.alert(
        'Settings Error', 
        `Failed to update ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}. Please try again.`
      );
    } finally {
      setSettingsLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // External Links Handlers
  const handlePrivacyPolicy = () => {
    Linking.openURL('https://icn.org.au/icn_vic/');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://icn.org.au/icn_vic/');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:research@icn.vic.gov.au');
  };

  const handleRateApp = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/app/icn-navigator');
    } else {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.icnvictoria.navigator');
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out ICN Navigator - Connect with Victorian businesses!\nhttps://icnvictoria.com/app',
        title: 'Share ICN Navigator',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleClearGeocodeCache = async () => {
    Alert.alert(
      'Clear Geocode Cache',
      'This will clear all cached geocoding data (2,022+ entries) and force fresh API calls. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await hybridDataService.clearGeocodeCache();
              Alert.alert('Success', 'Geocode cache cleared. Restart the app to reload with fresh API calls.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear geocode cache');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Sign Out Handler
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              await AuthService.signOut?.();
              
              if (typeof logout === 'function') {
                await logout();
              } else {
                clearUser();
              }
            } catch (error) {
              setIsLoading(false);
              Alert.alert(
                'Error', 
                'Failed to sign out. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        },
      ]
    );
  };

  // Delete Account Handler
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Verify Your Identity',
              'Please enter your password to confirm account deletion:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: async (password?: string) => {
                    if (!password) {
                      Alert.alert('Error', 'Password is required');
                      return;
                    }

                    try {
                      setIsLoading(true);
                      
                      await AuthService.deleteAccount(password);
                      if (typeof logout === 'function') {
                        await logout();
                      } else {
                        clearUser();
                      }
                      
                      Alert.alert(
                        'Account Deleted',
                        'Your account has been successfully deleted.',
                        [{ text: 'OK' }]
                      );
                    } catch (error: any) {
                      setIsLoading(false);
                      Alert.alert(
                        'Deletion Failed',
                        error.message || 'Unable to delete account. Please contact support.',
                        [
                          { text: 'OK', style: 'cancel' },
                          { 
                            text: 'Contact Support', 
                            onPress: () => Linking.openURL('mailto:research@icn.vic.gov.au')
                          }
                        ]
                      );
                    }
                  }
                }
              ],
              'secure-text',
              '',
              'default'
            );
          }
        },
      ]
    );
  };

  // Export Data Handler
  const handleExportData = () => {
    if (currentTier === 'free' && features.exportLimit <= 0) {
      Alert.alert(
        'Export Limit Reached',
        `You've used all your free exports this month. Upgrade to Plus or Premium for more.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Payment') }
        ]
      );
      return;
    }

    Alert.alert(
      'Export Your Data',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'JSON Format',
          onPress: async () => await performDataExport('json')
        },
        {
          text: 'CSV Format',
          onPress: async () => await performDataExport('csv')
        },
      ]
    );
  };

  const performDataExport = async (format: 'json' | 'csv') => {
    try {
      setIsLoading(true);
      
      await DataExportService.exportUserData(format);
      
      if (currentTier !== 'premium') {
        await DataExportService.updateExportCount();
      }
      
      setIsLoading(false);
      
      Alert.alert(
        'Export Complete',
        'Your data has been exported successfully.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert(
        'Export Failed',
        error.message || 'Unable to export data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return {
    avatarLoading,
    isLoading,
    settingsLoading,
    handleEditProfile,
    handleChangePassword,
    handleUpgrade,
    handleManageSubscription,
    handleCancelSubscription,
    handleSettingChange,
    handlePrivacyPolicy,
    handleTermsOfService,
    handleContactSupport,
    handleRateApp,
    handleShareApp,
    handleClearGeocodeCache,
    handleSignOut,
    handleDeleteAccount,
    handleExportData,
    handleAvatarPress,
  };
};
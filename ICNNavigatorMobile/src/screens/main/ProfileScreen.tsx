import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Share,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing } from '../../constants/colors';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useUserTier, UserTier } from '../../contexts/UserTierContext';
import { useSubscription } from '../../hooks/useSubscription';
import { useUser } from '../../contexts/UserContext';
import { useSettings } from '../../contexts/SettingsContext';
import SubscriptionCard from '../../components/common/SubscriptionCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../../services/authService';
import DataExportService from '../../services/dataExportService';
import hybridDataService from '../../services/hybridDataService';

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const ProfileSection = ({ title, children, isCollapsed = false, onToggle }: ProfileSectionProps) => (
  <View style={styles.section}>
    <TouchableOpacity 
      style={styles.sectionHeader} 
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons 
        name={isCollapsed ? "chevron-down" : "chevron-up"} 
        size={20} 
        color="#1B3E6F" 
      />
    </TouchableOpacity>
    {!isCollapsed && (
      <View style={styles.sectionContent}>{children}</View>
    )}
  </View>
);

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string | React.ReactNode;
  onPress?: () => void;
  showArrow?: boolean;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  disabled?: boolean;
}

const SettingItem = ({
  icon,
  title,
  value,
  onPress,
  showArrow = true,
  isSwitch = false,
  switchValue,
  onSwitchChange,
  disabled = false,
}: SettingItemProps) => (
  <TouchableOpacity
    style={[styles.settingItem, disabled && styles.settingItemDisabled]}
    onPress={isSwitch ? undefined : onPress}
    disabled={isSwitch || disabled}
    activeOpacity={isSwitch ? 1 : 0.7}
  >
    <View style={styles.settingLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color="#1B3E6F" />
      </View>
      <Text style={styles.settingTitle}>{title}</Text>
    </View>
    <View style={styles.settingRight}>
      {value && typeof value === 'string' && (
        <Text style={styles.settingValue}>{value}</Text>
      )}
      {value && typeof value !== 'string' && value}
      {isSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: Colors.black20, true: '#1B3E6F' }}
          thumbColor={switchValue ? Colors.white : Colors.black50}
          disabled={disabled}
        />
      )}
      {showArrow && !isSwitch && (
        <Ionicons name="chevron-forward" size={16} color="rgba(0, 0, 0, 0.3)" />
      )}
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { currentTier, setCurrentTier, features } = useUserTier();
  const { 
    subscription, 
    cancelSubscription, 
    refreshSubscription 
  } = useSubscription();
  
  // Use contexts for user data and settings
  const { user, isLoading: userLoading, updateUser, refreshUser, clearUser, logout } = useUser();
  const { settings, updateSetting, syncSettings } = useSettings();
  
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState({
    notifications: false,
    locationServices: false,
    darkMode: false,
    autoSync: false,
  });

  // Collapsible sections state - default to collapsed (true)
  const [collapsedSections, setCollapsedSections] = useState({
    account: true,
    preferences: true,
    dataPrivacy: true,
    support: true,
    about: true,
  });

  // Toggle section collapse
  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Refresh data when screen focuses
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshSubscription();
      // refreshUser(); // Disabled auto-refresh because backend has no profile refresh endpoint, using cached data from login
      syncSettings();
    });
    return unsubscribe;
  }, [navigation, refreshSubscription, syncSettings]); // Removed refreshUser from dependencies

  // Stats based on tier
  const getStats = () => {
    const tier = subscription?.tier || currentTier;
    switch(tier) {
      case 'premium':
        return { saved: '∞', searches: '∞', exports: '∞' };
      case 'plus':
        return { saved: '50', searches: '500/mo', exports: '50/mo' };
      default:
        return { saved: '10', searches: '100/mo', exports: '2/mo' };
    }
  };

  const stats = getStats();

  // Get tier display info from actual subscription
  const getTierInfo = () => {
    if (!subscription) {
      return { 
        name: 'Free', 
        color: Colors.black50,
        icon: 'star-outline',
        price: null,
        nextBilling: null
      };
    }

    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return null;
      return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    const getPrice = () => {
      if (!subscription.amount) return null;
      
      if (subscription.billingPeriod) {
        return `${subscription.amount.toFixed(2)}/${subscription.billingPeriod === 'yearly' ? 'year' : 'month'}`;
      }
      
      const isYearly = subscription.amount >= 50;
      return `${subscription.amount.toFixed(2)}/${isYearly ? 'year' : 'month'}`;
    };

    switch(subscription.tier) {
      case 'premium':
        return { 
          name: 'Premium', 
          color: '#1B3E6F', // Match blue theme
          icon: 'star',
          price: getPrice(),
          nextBilling: formatDate(subscription.nextBillingDate)
        };
      case 'plus':
        return { 
          name: 'Plus', 
          color: '#1B3E6F', // Match Profile page blue theme
          icon: 'star-half',
          price: getPrice(),
          nextBilling: formatDate(subscription.nextBillingDate)
        };
      default:
        return { 
          name: 'Free', 
          color: Colors.black50,
          icon: 'star-outline',
          price: null,
          nextBilling: null
        };
    }
  };

  const tierInfo = getTierInfo();

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
      // Don't clear avatar on error - keep the local preview
    }
  };

  const showAvatarOptions = () => {
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
  const handleSettingChange = async (
    key: keyof typeof settings, 
    value: boolean
  ) => {
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
                await logout();              // clears tokens + user
              } else {
                clearUser();                 // fallback
              }
              // No navigation here; AppNavigator will render Auth stack now


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
                      // No imperative navigation; AppNavigator shows Auth
                      
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

  // Show loading state while user data loads
  if (userLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1B3E6F" />
        <Text style={styles.loadingMessage}>Loading profile...</Text>
      </View>
    );
  }

  // Handle case where user is not logged in
  if (!user) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.black50} />
        <Text style={styles.errorMessage}>Unable to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshUser}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Background Logo */}
        <Image 
          source={require('../../../assets/ICN Logo Source/ICN-logo-little.png')} 
          style={styles.backgroundLogo}
          resizeMode="cover"
        />
        
        <ScrollView 
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {/* User Profile Card with Avatar - Horizontal Layout */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {/* Left: Avatar */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={showAvatarOptions} disabled={avatarLoading}>
                {avatarLoading ? (
                  <View style={styles.avatar}>
                    <ActivityIndicator size="large" color={Colors.white} />
                  </View>
                ) : user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.editAvatarButton} 
                onPress={showAvatarOptions}
                disabled={avatarLoading}
              >
                <Ionicons name="camera" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
            
            {/* Right: User Info */}
            <View style={styles.userInfo}>
              <View style={styles.userInfoHeader}>
                <View style={styles.userTextContainer}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userRole}>{user.role} at {user.company}</Text>
                </View>
                <TouchableOpacity style={styles.editIconButton} onPress={handleEditProfile}>
                  <Ionicons name="create-outline" size={22} color="rgba(27, 62, 111, 0.8)" />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.tierBadge, { backgroundColor: tierInfo.color + '30' }]}>
                <Ionicons name={tierInfo.icon as any} size={14} color={tierInfo.color} />
                <Text style={[styles.tierText, { color: tierInfo.color }]}>
                  {tierInfo.name} Member
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, stats.saved === '∞' && styles.infinitySymbol]}>{stats.saved}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, stats.searches === '∞' && styles.infinitySymbol]}>{stats.searches}</Text>
              <Text style={styles.statLabel}>Searches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.memberSince}</Text>
              <Text style={styles.statLabel}>Member</Text>
            </View>
          </View>

        </View>

        {/* Subscription Management Card */}
        <View style={{ marginVertical: 8 }}>
          <SubscriptionCard
            plan={(subscription?.tier || currentTier) as 'free' | 'plus' | 'premium'}
            renewalDate={tierInfo.nextBilling || undefined}
            monthlyPrice={
              subscription?.billingPeriod === 'monthly' ? subscription.amount : undefined
            }
            onUpgrade={() => {
              const targetPlan = currentTier === 'free' ? 'plus' : 'premium';
              navigation.navigate('Payment', { selectedPlan: targetPlan });
            }}
            onManage={handleManageSubscription}
            onCancel={handleCancelSubscription}
          />
        </View>

        {/* Separator Line */}
        <View style={styles.sectionSeparator} />

        {/* Account Settings */}
        <ProfileSection 
          title="Account"
          isCollapsed={collapsedSections.account}
          onToggle={() => toggleSection('account')}
        >
          <SettingItem
            icon="mail-outline"
            title="Email"
            value={user.email}
            showArrow={false}
          />
          <SettingItem
            icon="call-outline"
            title="Phone"
            value={user.phone}
            showArrow={false}
          />
          <SettingItem
            icon="key-outline"
            title="Change Password"
            onPress={handleChangePassword}
          />
          <SettingItem
            icon="ribbon-outline"
            title="Subscription"
            value={
              <View style={[styles.upgradeBadge, { backgroundColor: '#1B3E6F' }]}>
                <Text style={styles.upgradeText}>{tierInfo.name}</Text>
              </View>
            }
            onPress={handleUpgrade}
          />
        </ProfileSection>

        {/* Section Separator */}
        <View style={styles.sectionDivider} />

        {/* Preferences - Now using context */}
        <ProfileSection 
          title="Preferences"
          isCollapsed={collapsedSections.preferences}
          onToggle={() => toggleSection('preferences')}
        >
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            isSwitch
            switchValue={settings.notifications}
            onSwitchChange={(value) => handleSettingChange('notifications', value)}
            disabled={settingsLoading.notifications}
          />
          <SettingItem
            icon="location-outline"
            title="Location Services"
            isSwitch
            switchValue={settings.locationServices}
            onSwitchChange={(value) => handleSettingChange('locationServices', value)}
            disabled={settingsLoading.locationServices}
          />
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            isSwitch
            switchValue={settings.darkMode}
            onSwitchChange={(value) => handleSettingChange('darkMode', value)}
            disabled={settingsLoading.darkMode}
          />
          <SettingItem
            icon="sync-outline"
            title="Auto-Sync Data"
            isSwitch
            switchValue={settings.autoSync}
            onSwitchChange={(value) => handleSettingChange('autoSync', value)}
            disabled={settingsLoading.autoSync}
          />
        </ProfileSection>

        {/* Section Separator */}
        <View style={styles.sectionDivider} />

        {/* Data & Privacy */}
        <ProfileSection 
          title="Data & Privacy"
          isCollapsed={collapsedSections.dataPrivacy}
          onToggle={() => toggleSection('dataPrivacy')}
        >
          <SettingItem
            icon="download-outline"
            title="Export My Data"
            value={stats.exports === '∞' ? 'Unlimited' : `${stats.exports} left`}
            onPress={handleExportData}
          />
          <SettingItem
            icon="trash-bin-outline"
            title="Clear Geocode Cache"
            value="2,022 entries"
            onPress={handleClearGeocodeCache}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            onPress={handlePrivacyPolicy}
          />
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={handleTermsOfService}
          />
          <SettingItem
            icon="trash-outline"
            title="Delete Account"
            onPress={handleDeleteAccount}
            showArrow={false}
          />
        </ProfileSection>

        {/* Section Separator */}
        <View style={styles.sectionDivider} />

        {/* Support */}
        <ProfileSection 
          title="Support"
          isCollapsed={collapsedSections.support}
          onToggle={() => toggleSection('support')}
        >
          <SettingItem
            icon="help-circle-outline"
            title="Help Center"
            onPress={() => Linking.openURL('mailto:research@icn.vic.gov.au')}
          />
          <SettingItem
            icon="chatbubble-outline"
            title="Contact Support"
            onPress={handleContactSupport}
          />
          <SettingItem
            icon="star-outline"
            title="Rate App"
            onPress={handleRateApp}
          />
          <SettingItem
            icon="share-outline"
            title="Share App"
            onPress={handleShareApp}
          />
        </ProfileSection>

        {/* Section Separator */}
        <View style={styles.sectionDivider} />

        {/* About */}
        <ProfileSection 
          title="About"
          isCollapsed={collapsedSections.about}
          onToggle={() => toggleSection('about')}
        >
          <SettingItem
            icon="information-circle-outline"
            title="App Version"
            value="1.0.0"
            showArrow={false}
          />
          <SettingItem
            icon="business-outline"
            title="About ICN"
            onPress={() => Linking.openURL('https://icn.org.au/icn_vic/about/')}
          />
          <SettingItem
            icon="globe-outline"
            title="Website"
            value="icnvictoria.com"
            onPress={() => Linking.openURL('https://icn.org.au/icn_vic/')}
          />
        </ProfileSection>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ICN Navigator v1.0.0</Text>
          <Text style={styles.footerSubText}>© 2025 ICN Victoria</Text>
        </View>
        </ScrollView>
      </SafeAreaView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1B3E6F" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
  },
  backgroundLogo: {
    position: 'absolute',
    top: 100,
    left: -80,
    width: 400,
    height: 400,
    opacity: 0.05, // Even more subtle background logo
    zIndex: 0,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent to show background logo
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMessage: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.black50,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessage: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.black50,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1B3E6F', // Updated button color
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly more opaque for even color
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12, // Match SubscriptionCard radius
    padding: 20,
    shadowColor: '#000', // Match SubscriptionCard shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'flex-start',
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  userTextContainer: {
    flex: 1,
    alignItems: 'flex-end', // Right align text content
  },
  editIconButton: {
    padding: 2,
    marginLeft: 4,
    marginRight: -4, // Move closer to the edge
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 0, // Remove bottom margin for horizontal layout
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1B3E6F', // Updated button color
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1B3E6F', // Updated button color
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700', // Heavier font weight
    color: 'rgba(27, 62, 111, 0.95)',
    marginBottom: 6,
    textAlign: 'right', // Right align text
    letterSpacing: 0.5, // Add letter spacing for elegance
    textShadowColor: 'rgba(27, 62, 111, 0.1)', // Subtle text shadow
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userRole: {
    fontSize: 13, // Slightly smaller as requested
    color: 'rgba(27, 62, 111, 0.7)',
    marginBottom: 8,
    textAlign: 'right', // Right align text
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 0,
    gap: 4,
    alignSelf: 'flex-end', // Align to right to match text alignment
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(27, 62, 111, 0.9)', // Added 10% transparency
  },
  infinitySymbol: {
    fontSize: 28, // Larger size for infinity symbol
    fontWeight: '300', // Lighter weight for better appearance
    letterSpacing: 1,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.black50,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.black20,
  },
  section: {
    backgroundColor: 'transparent', // Completely transparent
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Simple transparent border
  },
  sectionSeparator: {
    height: 0, // Remove separator line
  },
  sectionDivider: {
    height: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.15)', // Thinner but slightly darker line
    marginHorizontal: 32,
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent', // Completely transparent
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(27, 62, 111, 0.95)', // Slightly deeper blue for section titles
    letterSpacing: 0.3, // Subtle letter spacing for elegance
    flex: 1,
  },
  sectionContent: {
    backgroundColor: 'transparent', // Transparent content background
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'transparent', // Completely transparent
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)', // Simple transparent separator
    marginHorizontal: 0,
  },
  settingItemDisabled: {
    opacity: 0.6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(27, 62, 111, 0.1)', // Subtle blue background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    color: 'rgba(27, 62, 111, 0.85)', // Slightly deeper blue-gray color
    fontWeight: '500', // Slightly bolder than normal but not too heavy
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: 'rgba(27, 62, 111, 0.7)', // Slightly deeper blue-gray for values
    fontWeight: '400', // Normal weight for secondary text
    marginRight: 4,
  },
  upgradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  upgradeText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: Colors.black50,
  },
  footerSubText: {
    fontSize: 11,
    color: Colors.black50,
    marginTop: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingText: {
    color: Colors.white,
    marginTop: 10,
    fontSize: 16,
  },
});
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
import SubscriptionCard from '../../components/common/SubscriptionCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../../services/authService';
import DataExportService from '../../services/dataExportService';

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

const ProfileSection = ({ title, children }: ProfileSectionProps) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
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
}: SettingItemProps) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={isSwitch ? undefined : onPress}
    disabled={isSwitch}
    activeOpacity={isSwitch ? 1 : 0.7}
  >
    <View style={styles.settingLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
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
          trackColor={{ false: Colors.black20, true: Colors.primary }}
          thumbColor={switchValue ? Colors.white : Colors.black50}
        />
      )}
      {showArrow && !isSwitch && (
        <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
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
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // User state (would typically come from Redux/context)
  const [user, setUser] = useState({
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+61 400 123 456',
    company: 'ABC Construction',
    role: 'Project Manager',
    memberSince: '2024',
    avatar: null as string | null,
  });

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  // Refresh subscription data when screen focuses
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshSubscription();
    });
    return unsubscribe;
  }, [navigation, refreshSubscription]);

  // Stats based on tier
  const getStats = () => {
    const tier = subscription?.tier || currentTier;
    switch(tier) {
      case 'premium':
        return { saved: 'Unlimited', searches: 'Unlimited', exports: 'Unlimited' };
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
          color: Colors.warning,
          icon: 'star',
          price: getPrice(),
          nextBilling: formatDate(subscription.nextBillingDate)
        };
      case 'plus':
        return { 
          name: 'Plus', 
          color: Colors.primary,
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
      setUser({ ...user, avatar: result.assets[0].uri });
      uploadAvatar(result.assets[0].uri);
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
      setUser({ ...user, avatar: result.assets[0].uri });
      uploadAvatar(result.assets[0].uri);
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
      
      console.log('Avatar uploaded successfully');
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
      setUser({ ...user, avatar: null });
    }
  };

  const showAvatarOptions = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose a method',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImageFromGallery },
        user.avatar && { text: 'Remove Photo', onPress: () => setUser({ ...user, avatar: null }), style: 'destructive' },
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

  // External Links Handlers
  const handlePrivacyPolicy = () => {
    Linking.openURL('https://icnvictoria.com/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://icnvictoria.com/terms');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@icnvictoria.com');
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

  // UPDATED: Sign Out Handler with actual functionality
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
              
              await AuthService.signOut();
              
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
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

  // UPDATED: Delete Account Handler with password verification
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
                      
                      navigation.dispatch(
                        CommonActions.reset({
                          index: 0,
                          routes: [{ name: 'Onboarding' }],
                        })
                      );
                      
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
                            onPress: () => Linking.openURL('mailto:support@icnvictoria.com')
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

  // UPDATED: Export Data Handler with format selection
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
          onPress: async () => {
            await performDataExport('json');
          }
        },
        {
          text: 'CSV Format',
          onPress: async () => {
            await performDataExport('csv');
          }
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

  return (
    <>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Profile Card with Avatar */}
        <View style={styles.profileCard}>
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
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editAvatarButton} 
              onPress={showAvatarOptions}
              disabled={avatarLoading}
            >
              <Ionicons name="camera" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>{user.role} at {user.company}</Text>
          
          <View style={[styles.tierBadge, { backgroundColor: tierInfo.color + '30' }]}>
            <Ionicons name={tierInfo.icon as any} size={16} color={tierInfo.color} />
            <Text style={[styles.tierText, { color: tierInfo.color }]}>
              {tierInfo.name} Member
            </Text>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.saved}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.searches}</Text>
              <Text style={styles.statLabel}>Searches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.memberSince}</Text>
              <Text style={styles.statLabel}>Member</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
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

        {/* Account Settings */}
        <ProfileSection title="Account">
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
              <View style={[styles.upgradeBadge, { backgroundColor: tierInfo.color }]}>
                <Text style={styles.upgradeText}>{tierInfo.name}</Text>
              </View>
            }
            onPress={handleUpgrade}
          />
        </ProfileSection>

        {/* Preferences */}
        <ProfileSection title="Preferences">
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            isSwitch
            switchValue={notifications}
            onSwitchChange={setNotifications}
          />
          <SettingItem
            icon="location-outline"
            title="Location Services"
            isSwitch
            switchValue={locationServices}
            onSwitchChange={setLocationServices}
          />
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            isSwitch
            switchValue={darkMode}
            onSwitchChange={setDarkMode}
          />
          <SettingItem
            icon="sync-outline"
            title="Auto-Sync Data"
            isSwitch
            switchValue={autoSync}
            onSwitchChange={setAutoSync}
          />
        </ProfileSection>

        {/* Data & Privacy */}
        <ProfileSection title="Data & Privacy">
          <SettingItem
            icon="download-outline"
            title="Export My Data"
            value={`${stats.exports} left`}
            onPress={handleExportData}
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

        {/* Support */}
        <ProfileSection title="Support">
          <SettingItem
            icon="help-circle-outline"
            title="Help Center"
            onPress={() => Linking.openURL('https://icnvictoria.com/help')}
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

        {/* About */}
        <ProfileSection title="About">
          <SettingItem
            icon="information-circle-outline"
            title="App Version"
            value="1.0.0"
            showArrow={false}
          />
          <SettingItem
            icon="business-outline"
            title="About ICN"
            onPress={() => Linking.openURL('https://icnvictoria.com/about')}
          />
          <SettingItem
            icon="globe-outline"
            title="Website"
            value="icnvictoria.com"
            onPress={() => Linking.openURL('https://icnvictoria.com')}
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

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.orange[200],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: Colors.black50,
    marginBottom: 12,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
    gap: 4,
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
    color: Colors.primary,
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
  editProfileButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editProfileText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.orange[400],
  },
  sectionContent: {
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
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
    backgroundColor: Colors.orange[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.black50,
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
    backgroundColor: Colors.white,
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
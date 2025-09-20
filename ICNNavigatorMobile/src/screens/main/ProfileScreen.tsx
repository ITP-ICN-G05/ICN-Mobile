import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/colors';

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
  // User state (would typically come from Redux/context)
  const [user] = useState({
    name: 'John Smith',
    email: 'john.smith@icnvictoria.com',
    phone: '+61 400 123 456',
    company: 'ICN Victoria',
    role: 'Project Manager',
    memberSince: '2024',
    tier: 'Premium',
  });

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  // Handlers
  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change feature coming soon!');
  };

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

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export your saved companies and search history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => Alert.alert('Success', 'Data exported successfully!')
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => Alert.alert('Account Deletion', 'Please contact support to complete account deletion.')
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            // Implement actual sign out logic here
            Alert.alert('Signed Out', 'You have been signed out successfully.');
          }
        },
      ]
    );
  };

  const handleUpgrade = () => {
    Alert.alert(
      'Upgrade to Premium',
      'Unlock advanced features:\n• Unlimited searches\n• Advanced filters\n• Export capabilities\n• Priority support',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => console.log('Navigate to upgrade screen') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>{user.role} at {user.company}</Text>
          
          <View style={styles.tierBadge}>
            <Ionicons name="star" size={16} color={Colors.warning} />
            <Text style={styles.tierText}>{user.tier} Member</Text>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>47</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>152</Text>
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
              <View style={styles.upgradeBadge}>
                <Text style={styles.upgradeText}>Premium</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 20,
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
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
    gap: 4,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
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
    backgroundColor: Colors.warning,
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
});
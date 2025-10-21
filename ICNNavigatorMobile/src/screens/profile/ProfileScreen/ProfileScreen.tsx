import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useProfileData } from './hooks/useProfileData';
import { useProfileActions } from './hooks/useProfileActions';
import { ProfileHeader } from './components/ProfileHeader';
import { AccountSection } from './sections/AccountSection';
import { PreferencesSection } from './sections/PreferencesSection';
import { DataPrivacySection } from './sections/DataPrivacySection';
import { SupportSection } from './sections/SupportSection';
import { AboutSection } from './sections/AboutSection';
import SubscriptionCard from '@/components/common/SubscriptionCard';
import { Colors } from '@/constants/colors';
import { styles } from './styles';

export default function ProfileScreen() {
  const {
    user,
    userLoading,
    subscription,
    currentTier,
    settings,
    collapsedSections,
    stats,
    tierInfo,
    toggleSection,
    refreshUser,
  } = useProfileData();

  const {
    avatarLoading,
    isLoading,
    settingsLoading,
    handleEditProfile,
    handleChangePassword,
    handleUpgrade,
    handleManageSubscription,
    handleCancelSubscription,
    handleSettingChange,
    handleSignOut,
    handleDeleteAccount,
    handleExportData,
    handleClearGeocodeCache,
    handlePrivacyPolicy,
    handleTermsOfService,
    handleContactSupport,
    handleRateApp,
    handleShareApp,
    handleAvatarPress,
  } = useProfileActions();

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

  const handleAboutICN = () => {
    Linking.openURL('https://icn.org.au/icn_vic/about/');
  };

  const handleWebsite = () => {
    Linking.openURL('https://icn.org.au/icn_vic/');
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Background Logo */}
        <Image 
          source={require('../../../../assets/ICN Logo Source/ICN-logo-little.png')} 
          style={styles.backgroundLogo}
          resizeMode="cover"
        />
        
        <ScrollView 
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header */}
          <ProfileHeader
            user={user}
            tierInfo={tierInfo}
            stats={stats}
            avatarLoading={avatarLoading}
            onEditProfile={handleEditProfile}
            onAvatarPress={handleAvatarPress}
          />

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
                handleUpgrade();
              }}
              onManage={handleManageSubscription}
              onCancel={handleCancelSubscription}
            />
          </View>

          {/* Separator Line */}
          <View style={styles.sectionSeparator} />

          {/* Account Settings */}
          <AccountSection
            user={user}
            tierInfo={tierInfo}
            isCollapsed={collapsedSections.account}
            onToggle={() => toggleSection('account')}
            onEditProfile={handleEditProfile}
            onChangePassword={handleChangePassword}
            onUpgrade={handleUpgrade}
          />

          {/* Section Separator */}
          <View style={styles.sectionDivider} />

          {/* Preferences */}
          <PreferencesSection
            settings={settings}
            settingsLoading={settingsLoading}
            isCollapsed={collapsedSections.preferences}
            onToggle={() => toggleSection('preferences')}
            onSettingChange={handleSettingChange}
          />

          {/* Section Separator */}
          <View style={styles.sectionDivider} />

          {/* Data & Privacy */}
          <DataPrivacySection
            stats={stats}
            currentTier={currentTier}
            isCollapsed={collapsedSections.dataPrivacy}
            onToggle={() => toggleSection('dataPrivacy')}
            onExportData={handleExportData}
            onClearGeocodeCache={handleClearGeocodeCache}
            onPrivacyPolicy={handlePrivacyPolicy}
            onTermsOfService={handleTermsOfService}
            onDeleteAccount={handleDeleteAccount}
          />

          {/* Section Separator */}
          <View style={styles.sectionDivider} />

          {/* Support */}
          <SupportSection
            isCollapsed={collapsedSections.support}
            onToggle={() => toggleSection('support')}
            onContactSupport={handleContactSupport}
            onRateApp={handleRateApp}
            onShareApp={handleShareApp}
          />

          {/* Section Separator */}
          <View style={styles.sectionDivider} />

          {/* About */}
          <AboutSection
            isCollapsed={collapsedSections.about}
            onToggle={() => toggleSection('about')}
            onAboutICN={handleAboutICN}
            onWebsite={handleWebsite}
          />

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
import React from 'react';
import { ProfileSection } from '../components/ProfileSection';
import { SettingItem } from '../components/SettingItem';
import { UserStats } from '../types';

interface DataPrivacySectionProps {
  stats: UserStats;
  currentTier: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onExportData: () => void;
  onClearGeocodeCache: () => void;
  onPrivacyPolicy: () => void;
  onTermsOfService: () => void;
  onDeleteAccount: () => void;
}

export const DataPrivacySection: React.FC<DataPrivacySectionProps> = ({
  stats,
  currentTier,
  isCollapsed,
  onToggle,
  onExportData,
  onClearGeocodeCache,
  onPrivacyPolicy,
  onTermsOfService,
  onDeleteAccount,
}) => (
  <ProfileSection 
    title="Data & Privacy"
    isCollapsed={isCollapsed}
    onToggle={onToggle}
  >
    <SettingItem
      icon="download-outline"
      title="Export My Data"
      value={stats.exports === '∞' ? 'Unlimited' : `${stats.exports} left`}
      onPress={onExportData}
    />
    <SettingItem
      icon="trash-bin-outline"
      title="Clear Geocode Cache"
      value="2,022 entries"
      onPress={onClearGeocodeCache}
    />
    <SettingItem
      icon="shield-checkmark-outline"
      title="Privacy Policy"
      onPress={onPrivacyPolicy}
    />
    <SettingItem
      icon="document-text-outline"
      title="Terms of Service"
      onPress={onTermsOfService}
    />
    <SettingItem
      icon="trash-outline"
      title="Delete Account"
      onPress={onDeleteAccount}
      showArrow={false}
    />
  </ProfileSection>
);
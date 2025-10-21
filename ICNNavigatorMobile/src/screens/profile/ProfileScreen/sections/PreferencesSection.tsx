import React from 'react';
import { ProfileSection } from '../components/ProfileSection';
import { SettingItem } from '../components/SettingItem';
import { Settings, SettingsLoading } from '../types';

interface PreferencesSectionProps {
  settings: Settings;
  settingsLoading: SettingsLoading;
  isCollapsed: boolean;
  onToggle: () => void;
  onSettingChange: (key: keyof SettingsLoading, value: boolean) => void;
}

export const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  settings,
  settingsLoading,
  isCollapsed,
  onToggle,
  onSettingChange,
}) => (
  <ProfileSection 
    title="Preferences"
    isCollapsed={isCollapsed}
    onToggle={onToggle}
  >
    <SettingItem
      icon="notifications-outline"
      title="Push Notifications"
      isSwitch
      switchValue={settings.notifications}
      onSwitchChange={(value) => onSettingChange('notifications', value)}
      disabled={settingsLoading.notifications}
    />
    <SettingItem
      icon="location-outline"
      title="Location Services"
      isSwitch
      switchValue={settings.locationServices}
      onSwitchChange={(value) => onSettingChange('locationServices', value)}
      disabled={settingsLoading.locationServices}
    />
    <SettingItem
      icon="moon-outline"
      title="Dark Mode"
      isSwitch
      switchValue={settings.darkMode}
      onSwitchChange={(value) => onSettingChange('darkMode', value)}
      disabled={settingsLoading.darkMode}
    />
    <SettingItem
      icon="sync-outline"
      title="Auto-Sync Data"
      isSwitch
      switchValue={settings.autoSync}
      onSwitchChange={(value) => onSettingChange('autoSync', value)}
      disabled={settingsLoading.autoSync}
    />
  </ProfileSection>
);
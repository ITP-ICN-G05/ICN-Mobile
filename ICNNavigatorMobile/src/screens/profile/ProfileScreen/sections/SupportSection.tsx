import React from 'react';
import { ProfileSection } from '../components/ProfileSection';
import { SettingItem } from '../components/SettingItem';

interface SupportSectionProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onContactSupport: () => void;
  onRateApp: () => void;
  onShareApp: () => void;
}

export const SupportSection: React.FC<SupportSectionProps> = ({
  isCollapsed,
  onToggle,
  onContactSupport,
  onRateApp,
  onShareApp,
}) => (
  <ProfileSection 
    title="Support"
    isCollapsed={isCollapsed}
    onToggle={onToggle}
  >
    <SettingItem
      icon="help-circle-outline"
      title="Help Center"
      onPress={onContactSupport}
    />
    <SettingItem
      icon="chatbubble-outline"
      title="Contact Support"
      onPress={onContactSupport}
    />
    <SettingItem
      icon="star-outline"
      title="Rate App"
      onPress={onRateApp}
    />
    <SettingItem
      icon="share-outline"
      title="Share App"
      onPress={onShareApp}
    />
  </ProfileSection>
);
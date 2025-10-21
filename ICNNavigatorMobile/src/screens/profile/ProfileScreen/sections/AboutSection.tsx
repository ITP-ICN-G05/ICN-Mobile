import React from 'react';
import { ProfileSection } from '../components/ProfileSection';
import { SettingItem } from '../components/SettingItem';

interface AboutSectionProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onAboutICN: () => void;
  onWebsite: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  isCollapsed,
  onToggle,
  onAboutICN,
  onWebsite,
}) => (
  <ProfileSection 
    title="About"
    isCollapsed={isCollapsed}
    onToggle={onToggle}
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
      onPress={onAboutICN}
    />
    <SettingItem
      icon="globe-outline"
      title="Website"
      value="icnvictoria.com"
      onPress={onWebsite}
    />
  </ProfileSection>
);
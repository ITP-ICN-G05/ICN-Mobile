import React from 'react';
import { View } from 'react-native';
import { ProfileSection } from '../components/ProfileSection';
import { SettingItem } from '../components/SettingItem';
import { User, TierInfo } from '../types';

interface AccountSectionProps {
  user: User;
  tierInfo: TierInfo;
  isCollapsed: boolean;
  onToggle: () => void;
  onEditProfile: () => void;
  onChangePassword: () => void;
  onUpgrade: () => void;
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  user,
  tierInfo,
  isCollapsed,
  onToggle,
  onEditProfile,
  onChangePassword,
  onUpgrade,
}) => (
  <ProfileSection 
    title="Account"
    isCollapsed={isCollapsed}
    onToggle={onToggle}
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
      onPress={onChangePassword}
    />
    <SettingItem
      icon="ribbon-outline"
      title="Subscription"
      value={
        <View style={[styles.upgradeBadge, { backgroundColor: '#1B3E6F' }]}>
          <Text style={styles.upgradeText}>{tierInfo.name}</Text>
        </View>
      }
      onPress={onUpgrade}
    />
  </ProfileSection>
);

import { StyleSheet, Text } from 'react-native';
import { Colors } from '../../../../constants/colors';

const styles = StyleSheet.create({
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
});
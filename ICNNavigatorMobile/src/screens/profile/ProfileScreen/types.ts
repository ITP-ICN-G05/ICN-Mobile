import { Ionicons } from '@expo/vector-icons';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  company: string;
  avatar?: string | null;
  memberSince: string;
}

export interface Settings {
  notifications: boolean;
  locationServices: boolean;
  darkMode: boolean;
  autoSync: boolean;
}

export interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export interface SettingItemProps {
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

export interface UserStats {
  saved: string;
  searches: string;
  exports: string;
}

export interface TierInfo {
  name: string;
  color: string;
  icon: string;
  price: string | null;
  nextBilling: string | null;
}

export interface CollapsedSections {
  account: boolean;
  preferences: boolean;
  dataPrivacy: boolean;
  support: boolean;
  about: boolean;
}

export interface SettingsLoading {
  notifications: boolean;
  locationServices: boolean;
  darkMode: boolean;
  autoSync: boolean;
}
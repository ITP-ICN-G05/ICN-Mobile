import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingItemProps } from '../types';
import { Colors } from '@/constants/colors';
import { styles } from '../styles';

export const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  value,
  onPress,
  showArrow = true,
  isSwitch = false,
  switchValue,
  onSwitchChange,
  disabled = false,
}) => (
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
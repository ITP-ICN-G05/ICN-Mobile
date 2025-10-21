import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileSectionProps } from '../types';
import { styles } from '../styles';

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  children,
  isCollapsed = false,
  onToggle,
}) => (
  <View style={styles.section}>
    <TouchableOpacity 
      style={styles.sectionHeader} 
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons 
        name={isCollapsed ? "chevron-down" : "chevron-up"} 
        size={20} 
        color="#1B3E6F" 
      />
    </TouchableOpacity>
    {!isCollapsed && (
      <View style={styles.sectionContent}>{children}</View>
    )}
  </View>
);
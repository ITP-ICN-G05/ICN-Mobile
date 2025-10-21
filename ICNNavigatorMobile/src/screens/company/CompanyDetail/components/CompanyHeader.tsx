import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { styles } from '../styles';

interface CompanyHeaderProps {
  company: any;
  displayName: string;
  isBookmarked: (id: string) => boolean;
  onBack: () => void;
  onShare: () => void;
  onBookmark: () => void;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  company,
  displayName,
  isBookmarked,
  onBack,
  onShare,
  onBookmark,
}) => {
  return (
    <>
      {/* Background Logo */}
      <Image 
        src='./assets/ICN Logo Source/ICN-logo-little.png' 
        style={styles.backgroundLogo}
        resizeMode="cover"
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={1}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Company Details</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onShare} style={styles.headerButton} activeOpacity={1}>
            <Ionicons name="share-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};
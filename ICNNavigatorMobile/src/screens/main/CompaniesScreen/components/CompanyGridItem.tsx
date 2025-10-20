import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Colors } from '../../../../constants/colors';
import { Company } from '../../../../types';
import { getDisplayName, getAvatarText, formatCityState } from '../utils/companyHelpers';

interface CompanyGridItemProps {
  company: Company;
  isBookmarked: boolean;
  onPress: (company: Company) => void;
  onBookmark: (id: string) => void;
}

export const CompanyGridItem: React.FC<CompanyGridItemProps> = ({
  company,
  isBookmarked,
  onPress,
  onBookmark,
}) => {
  const displayName = getDisplayName(company);
  
  return (
    <TouchableOpacity 
      style={styles.gridCard}
      onPress={() => onPress(company)}
      activeOpacity={0.9}
    >
      <View style={styles.gridAvatar}>
        <Text style={styles.gridAvatarText}>
          {getAvatarText(company)}
        </Text>
      </View>
      <Text style={styles.gridName} numberOfLines={2}>{displayName}</Text>
      <Text style={styles.gridAddress} numberOfLines={1}>
        {formatCityState(company)}
      </Text>
      <TouchableOpacity 
        style={styles.gridBookmark}
        onPress={() => onBookmark(company.id)}
      >
        <Ionicons 
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'} 
          size={16} 
          color={Colors.black50}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
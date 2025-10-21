import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Colors } from '../../../../constants/colors';
import { Company } from '../../../../types';
import { getDisplayName, getAvatarText } from '../utils/companyHelpers';

interface BookmarkedSectionProps {
  bookmarkedCompanies: Company[];
  onCompanyPress: (company: Company) => void;
}

export const BookmarkedSection: React.FC<BookmarkedSectionProps> = ({
  bookmarkedCompanies,
  onCompanyPress,
}) => {
  const renderBookmarkedItem = ({ item }: { item: Company }) => {
    const displayName = getDisplayName(item);
    
    return (
      <TouchableOpacity 
        style={styles.bookmarkedCard}
        onPress={() => onCompanyPress(item)}
      >
        <View style={styles.bookmarkedAvatar}>
          <Text style={styles.bookmarkedAvatarText}>
            {getAvatarText(item)}
          </Text>
        </View>
        <Text style={styles.bookmarkedName} numberOfLines={1}>
          {displayName}
        </Text>
        {item.verificationStatus === 'verified' && (
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.bookmarkedSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name="bookmark" size={18} color={Colors.black50} />
        <Text style={styles.sectionTitle}>Saved Companies</Text>
        <Text style={styles.sectionCount}>({bookmarkedCompanies.length})</Text>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={bookmarkedCompanies}
        keyExtractor={(item) => `bookmarked-${item.id}`}
        renderItem={renderBookmarkedItem}
        contentContainerStyle={styles.bookmarkedList}
      />
    </View>
  );
};
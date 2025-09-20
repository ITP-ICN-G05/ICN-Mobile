import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/colors';
import { Company } from '../../types';

interface CompanyCardProps {
  company: Company;
  onPress: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export default function CompanyCard({ 
  company, 
  onPress, 
  onBookmark,
  isBookmarked = false 
}: CompanyCardProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      activeOpacity={0.9}
      testID="company-card"
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {company.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{company.name}</Text>
          <Text style={styles.address} numberOfLines={1}>{company.address}</Text>
        </View>
        {onBookmark && (
          <TouchableOpacity 
            onPress={onBookmark} 
            style={styles.bookmarkButton}
            testID="bookmark-button"
          >
            <Ionicons 
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'} 
              size={24} 
              color={Colors.primary}
              testID={isBookmarked ? 'bookmark-icon-filled' : 'bookmark-icon-outline'}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {company.verificationStatus === 'verified' && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.verifiedText}>
            Verified on {company.verificationDate || '1/07/2025'}
          </Text>
        </View>
      )}
      
      <View style={styles.sectors}>
        {company.keySectors.slice(0, 2).map((sector, index) => (
          <View key={index} style={styles.sectorChip}>
            <Text style={styles.sectorText}>{sector}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.orange[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: Colors.black50,
  },
  bookmarkButton: {
    padding: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
    marginLeft: 4,
  },
  sectors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectorChip: {
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sectorText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
});
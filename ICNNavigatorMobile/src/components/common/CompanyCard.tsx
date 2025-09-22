import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Company } from '../../types';

// Local color definitions
const Colors = {
  white: '#FFFFFF',
  text: '#111111',
  black50: '#808080',
  success: '#B6D289', // Specified green color
  primary: '#F99F1C',
  orange300: '#FCCF8E',
  orange400: '#FEECD2',
  verified: '#E8F5E8', // Light green background
  arrow: '#CCCCCC',
  avatarBg: '#E0E0E0', // Gray avatar background
};

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
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {onBookmark && (
        <TouchableOpacity onPress={onBookmark} style={styles.bookmarkButton}>
          <Ionicons 
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'} 
            size={18} 
            color={Colors.black50}
          />
        </TouchableOpacity>
      )}
      
      <View style={styles.content}>
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
      </View>
      
      <View style={styles.rightSection}>
        <Ionicons 
          name="arrow-forward" 
          size={20} 
          color={Colors.arrow}
          style={styles.arrowIcon}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.avatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: Colors.black50,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.verified,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 25,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  verifiedText: {
    fontSize: 13,
    color: Colors.success,
    marginLeft: 5,
    fontWeight: '600',
  },
  sectors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sectorChip: {
    backgroundColor: Colors.orange400,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectorText: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500',
  },
  rightSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  arrowIcon: {
    opacity: 0.6,
  },
});
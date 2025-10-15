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
  supplier: '#E3F2FD', // Light blue for supplier
  manufacturer: '#FCE4EC', // Light pink for manufacturer
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
  
  // Format the verification date properly
  const formatVerificationDate = (date?: string) => {
    if (!date) return '';
    // Handle both ISO and d/MM/yyyy formats
    if (date.includes('-')) {
      // ISO format
      return new Date(date).toLocaleDateString('en-AU', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    }
    // Already in d/MM/yyyy format
    return date;
  };

  // Get display name (handle placeholder names from ICN)
  const displayName = company.name === 'Organisation Name' 
    ? `Company ${company.id.slice(-4)}` 
    : company.name;

  // Get company type badge color
  const getCompanyTypeBadge = () => {
    if (!company.companyType) return null;
    
    const typeColors = {
      supplier: Colors.supplier,
      manufacturer: Colors.manufacturer,
      service: Colors.orange300,
      consultant: Colors.orange400,
    };

    return (
      <View style={[styles.typeBadge, { backgroundColor: typeColors[company.companyType] || Colors.orange400 }]}>
        <Text style={styles.typeBadgeText}>
          {company.companyType.charAt(0).toUpperCase() + company.companyType.slice(1)}
        </Text>
      </View>
    );
  };

  // Get location display (city and state from billing address if available)
  const getLocationDisplay = () => {
    if (company.billingAddress) {
      const city = company.billingAddress.city;
      const state = company.billingAddress.state;
      const cleanValue = (s?: string) => 
        s && s !== '#N/A' && s.trim() !== '' ? s : null;
      const parts = [cleanValue(city), cleanValue(state)].filter(Boolean);
      if (parts.length) return parts.join(', ');
    }
    // Fallback to parsing address string
    const parts = company.address.split(',');
    if (parts.length >= 2) {
      return `${parts[parts.length - 2].trim()}, ${parts[parts.length - 1].trim().split(' ')[0]}`;
    }
    return 'Location unavailable';
  };

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
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.address} numberOfLines={1}>{getLocationDisplay()}</Text>
          </View>
        </View>
        
        <View style={styles.badges}>
          {company.verificationStatus === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.verifiedText}>
                Verified {company.verificationDate ? `on ${formatVerificationDate(company.verificationDate)}` : ''}
              </Text>
            </View>
          )}
          
          {getCompanyTypeBadge()}
        </View>
        
        {/* Show capabilities if from ICN data */}
        {company.icnCapabilities && company.icnCapabilities.length > 0 && (
          <View style={styles.capabilities}>
            {company.icnCapabilities.slice(0, 2).map((cap, index) => (
              <View key={`${cap.itemId}-${index}`} style={styles.capabilityChip}>
                <Text style={styles.capabilityText} numberOfLines={1}>
                  {cap.itemName}
                </Text>
              </View>
            ))}
            {company.icnCapabilities.length > 2 && (
              <View style={styles.moreChip}>
                <Text style={styles.moreText}>+{company.icnCapabilities.length - 2} more</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Show sectors */}
        {company.keySectors.length > 0 && (
          <View style={styles.sectors}>
            {company.keySectors.slice(0, 2).map((sector, index) => (
              <View key={index} style={styles.sectorChip}>
                <Text style={styles.sectorText}>{sector}</Text>
              </View>
            ))}
            {company.keySectors.length > 2 && (
              <View style={styles.moreSectorsChip}>
                <Text style={styles.moreSectorsText}>+{company.keySectors.length - 2} more</Text>
              </View>
            )}
          </View>
        )}
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
    marginBottom: 10,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 3,
  },
  address: {
    fontSize: 14,
    color: Colors.black50,
    lineHeight: 18,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.verified,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
    marginLeft: 4,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  capabilities: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  capabilityChip: {
    backgroundColor: Colors.orange400,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 120,
    flexShrink: 1,
  },
  capabilityText: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500',
  },
  moreChip: {
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  sectors: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 6,
  },
  sectorChip: {
    backgroundColor: Colors.orange400,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 120,
    flexShrink: 1,
  },
  sectorText: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500',
  },
  moreSectorsChip: {
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
  },
  moreSectorsText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',
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
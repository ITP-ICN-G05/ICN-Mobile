import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Colors } from '@/constants/colors';
import { getDisplayValue, formatABN } from '../utils';

interface CompanyBasicInfoProps {
  company: any;
  currentTier: string;
  displayName: string;
  isBookmarked: (id: string) => boolean;
  isSummaryExpanded: boolean;
  onBookmark: () => void;
  onToggleSummary: () => void;
}

export const CompanyBasicInfo: React.FC<CompanyBasicInfoProps> = ({
  company,
  currentTier,
  displayName,
  isBookmarked,
  isSummaryExpanded,
  onBookmark,
  onToggleSummary,
}) => {
  return (
    <View style={styles.card}>
      {/* Company Header */}
      <View style={styles.companyHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.companyInfo}>
          <View style={styles.companyNameRow}>
            <Text style={styles.companyName}>{displayName}</Text>
            <TouchableOpacity onPress={onBookmark} style={styles.bookmarkButton} activeOpacity={1}>
              <Ionicons 
                name={isBookmarked(company.id) ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={isBookmarked(company.id) ? Colors.primary : Colors.black50} 
              />
            </TouchableOpacity>
          </View>
          {company.verificationStatus === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.verifiedText}>
                ICN Verified {company.verificationDate ? `on ${new Date(company.verificationDate).toLocaleDateString('en-AU')}` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Address - All tiers */}
      {company.address && (
        <View style={styles.sectorsContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="location-outline" size={20} color={Colors.black50} />
            <Text style={styles.sectionTitle}>Address</Text>
          </View>
          <View style={styles.abnContainer}>
            <Text style={styles.addressText}>
              {getDisplayValue(company.address, 'Address available via ICN')}
            </Text>
          </View>
        </View>
      )}

      {/* ABN - Plus tier and above */}
      {(currentTier === 'plus' || currentTier === 'premium') && (company.abn || true) && (
        <View style={styles.sectorsContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text-outline" size={20} color={Colors.black50} />
            <Text style={styles.sectionTitle}>Company ABN</Text>
          </View>
          <View style={styles.abnContainer}>
            <Text style={styles.abnText}>
              {formatABN(company.abn)}
            </Text>
          </View>
        </View>
      )}

      {/* Company Summary - Plus tier and above */}
      {(currentTier === 'plus' || currentTier === 'premium') && (company.description || true) && (
        <View style={styles.sectorsContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text" size={20} color={Colors.black50} />
            <Text style={styles.sectionTitle}>Company Summary</Text>
          </View>
          
          <View style={styles.summaryContainer}>
            <Text 
              style={styles.summaryText}
              numberOfLines={isSummaryExpanded ? undefined : 3}
            >
              {company.description || 'Leading Australian company specializing in innovative solutions and sustainable business practices. With over two decades of experience, we deliver exceptional value to our clients through cutting-edge technology and expert consultation services. Our commitment to excellence and customer satisfaction has established us as a trusted partner in the industry.'}
            </Text>
            
            <TouchableOpacity 
              style={styles.summaryToggleButton}
              onPress={onToggleSummary}
              activeOpacity={1}
            >
              <Ionicons 
                name={isSummaryExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={Colors.success} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Diversity Markers - Premium tier */}
      {currentTier === 'premium' && (company.diversityMarkers || true) && (
        <View style={styles.sectorsContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="people-circle-outline" size={20} color={Colors.black50} />
            <Text style={styles.sectionTitle}>Diversity Markers</Text>
          </View>
          <View style={styles.diversityContainer}>
            {(company.diversityMarkers || ['Australian Disability Enterprise', 'Female Owned Business']).map((marker: string, index: number) => (
              <View key={index} style={styles.diversityChip}>
                <Ionicons name="ribbon-outline" size={14} color={Colors.success} />
                <Text style={styles.diversityText}>{marker}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Certifications & Badges - Premium tier */}
      {currentTier === 'premium' && (company.certifications || true) && (
        <View style={styles.sectorsContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.black50} />
            <Text style={styles.sectionTitle}>Certifications & Badges</Text>
          </View>
          <View style={styles.certificationsContainer}>
            {(company.certifications || ['Australian-made Certification', 'ISO 9001', 'Australian Standards']).map((cert: string, index: number) => (
              <View key={index} style={styles.certificationChip}>
                <Ionicons name="medal-outline" size={14} color={Colors.primary} />
                <Text style={styles.certificationText}>{cert}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Sectors - All tiers */}
      {company.keySectors && company.keySectors.length > 0 && (
        <View style={styles.sectorsContainer}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="business-outline" size={20} color={Colors.black50} />
            <Text style={styles.sectionTitle}>Operating Sectors</Text>
          </View>
          <View style={styles.sectorsList}>
            {company.keySectors.map((sector: string, index: number) => (
              <View key={index} style={styles.sectorChip}>
                <Text style={styles.sectorText}>{sector}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
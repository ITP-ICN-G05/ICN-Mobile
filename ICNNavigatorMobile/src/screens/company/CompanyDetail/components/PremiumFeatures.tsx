import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Colors } from '@/constants/colors';
import { getDisplayValue } from '../utils';

interface PremiumFeaturesProps {
  company: any;
  currentTier: string;
}

export const PremiumFeatures: React.FC<PremiumFeaturesProps> = ({
  company,
  currentTier,
}) => {
  if (currentTier !== 'premium') {
    return null;
  }

  return (
    <>
      {/* Business Metrics */}
      <View style={styles.card}>
        <Text style={styles.cardTitleStyled}>Business Metrics</Text>
        
        <View style={styles.metricsContainer}>
          {/* Revenue Card */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="trending-up" size={24} color={Colors.success} />
            </View>
            <Text style={styles.metricLabel}>Annual Revenue</Text>
            <Text style={[
              styles.metricValue,
              !company.revenue && styles.metricPlaceholder
            ]}>
              {company.revenue
                ? `$${company.revenue.toLocaleString()}` 
                : 'Contact for details'
              }
            </Text>
          </View>

          {/* Employee Count Card */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="people" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.metricLabel}>Team Size</Text>
            <Text style={[
              styles.metricValue,
              !company.employeeCount && styles.metricPlaceholder
            ]}>
              {company.employeeCount
                ? `${company.employeeCount.toLocaleString()} employees` 
                : 'Contact for details'
              }
            </Text>
          </View>
        </View>

        {/* Additional Metrics Row */}
        <View style={styles.additionalMetricsContainer}>
          {/* Local Content Percentage */}
          {getDisplayValue(company.localContentPercentage, '') && (
            <View style={styles.additionalMetricCard}>
              <View style={styles.additionalMetricIcon}>
                <Ionicons name="location" size={16} color={Colors.success} />
              </View>
              <Text style={styles.additionalMetricText}>
                {company.localContentPercentage}% Local Content
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Diversity & Certifications */}
      {(company.ownershipType?.length > 0 || 
        company.certifications?.length > 0 ||
        company.socialEnterprise || 
        company.australianDisabilityEnterprise) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Certifications & Diversity</Text>
          
          {/* Diversity Markers */}
          {company.ownershipType?.length > 0 && (
            <View style={styles.badgesContainer}>
              <Text style={styles.sectionTitle}>Ownership</Text>
              <View style={styles.badgesList}>
                {company.ownershipType.map((ownership: string, index: number) => (
                  <View key={index} style={styles.diversityBadge}>
                    <Ionicons name="ribbon" size={14} color={Colors.success} />
                    <Text style={styles.badgeText}>{ownership}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Social Enterprise Badge */}
          {company.socialEnterprise && (
            <View style={styles.badgeRow}>
              <View style={styles.specialBadge}>
                <Ionicons name="heart" size={16} color={Colors.primary} />
                <Text style={styles.specialBadgeText}>Social Enterprise</Text>
              </View>
            </View>
          )}

          {/* Australian Disability Enterprise Badge */}
          {company.australianDisabilityEnterprise && (
            <View style={styles.badgeRow}>
              <View style={styles.specialBadge}>
                <Ionicons name="accessibility" size={16} color={Colors.primary} />
                <Text style={styles.specialBadgeText}>Australian Disability Enterprise</Text>
              </View>
            </View>
          )}

          {/* Certifications */}
          {company.certifications?.length > 0 && (
            <View style={styles.certificationsContainer}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              <View style={styles.certificationsList}>
                {company.certifications.map((cert: string, index: number) => (
                  <View key={index} style={styles.certificationBadge}>
                    <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
                    <Text style={styles.certificationText}>{cert}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </>
  );
};
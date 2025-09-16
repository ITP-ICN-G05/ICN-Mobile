import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Linking,
  Share,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Company } from '../../types';
import { Colors, Spacing } from '../../constants/colors';

interface CompanyDetailScreenProps {
  route: any;
  navigation: any;
}

export default function CompanyDetailScreen({ route, navigation }: CompanyDetailScreenProps) {
  const { company } = route.params as { company: Company };
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // Handle bookmark toggle
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  // Handle share
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${company.name} on ICN Navigator\n${company.address}`,
        title: company.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Handle email
  const handleEmail = () => {
    if (company.email) {
      Linking.openURL(`mailto:${company.email}`);
    }
  };

  // Handle phone call
  const handleCall = () => {
    if (company.phoneNumber) {
      const phoneNumber = company.phoneNumber.replace(/[^0-9]/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  // Handle website
  const handleWebsite = () => {
    if (company.website) {
      const url = company.website.startsWith('http') 
        ? company.website 
        : `https://${company.website}`;
      Linking.openURL(url);
    }
  };

  // Handle directions
  const handleDirections = () => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    const latLng = `${company.latitude},${company.longitude}`;
    const label = encodeURIComponent(company.name);
    
    const url = Platform.select({
      ios: `${scheme}${latLng}?q=${label}`,
      android: `${scheme}${latLng}?q=${label}`,
    });
    
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleBookmark} style={styles.headerButton}>
            <Ionicons 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={Colors.white} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Company Info Card */}
        <View style={styles.card}>
          <View style={styles.companyHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {company.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{company.name}</Text>
              {company.verificationStatus === 'verified' && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.verifiedText}>
                    Verified on {company.verificationDate || 'Recently'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Key Sectors */}
          <View style={styles.sectorsContainer}>
            <Text style={styles.sectionTitle}>Key Sectors</Text>
            <View style={styles.sectorsList}>
              {company.keySectors.map((sector, index) => (
                <View key={index} style={styles.sectorChip}>
                  <Text style={styles.sectorText}>{sector}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Company Type */}
          {company.companyType && (
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={20} color={Colors.black50} />
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>
                {company.companyType.charAt(0).toUpperCase() + company.companyType.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Contact Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          
          {/* Address */}
          <TouchableOpacity style={styles.contactRow} onPress={handleDirections}>
            <View style={styles.contactIcon}>
              <Ionicons name="location-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Address</Text>
              <Text style={styles.contactValue}>{company.address}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
          </TouchableOpacity>

          {/* Phone */}
          {company.phoneNumber && (
            <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
              <View style={styles.contactIcon}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{company.phoneNumber}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
            </TouchableOpacity>
          )}

          {/* Email */}
          {company.email && (
            <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
              <View style={styles.contactIcon}>
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{company.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
            </TouchableOpacity>
          )}

          {/* Website */}
          {company.website && (
            <TouchableOpacity style={styles.contactRow} onPress={handleWebsite}>
              <View style={styles.contactIcon}>
                <Ionicons name="globe-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>{company.website}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
            <Ionicons name="mail" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
            <Ionicons name="navigate" size={24} color={Colors.white} />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Additional Information</Text>
          <View style={styles.additionalInfo}>
            <Text style={styles.infoText}>
              This company is listed in the ICN Navigator directory. 
              For more information about their services and capabilities, 
              please contact them directly using the information provided above.
            </Text>
            {company.verificationStatus === 'unverified' && (
              <View style={styles.warningBox}>
                <Ionicons name="information-circle" size={20} color={Colors.warning} />
                <Text style={styles.warningText}>
                  This company has not yet been verified. Please verify information independently.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 48 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.orange[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
  },
  sectorsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black50,
    marginBottom: 8,
  },
  sectorsList: {
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
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.black50,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.orange[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: Colors.black50,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: Colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
  },
  additionalInfo: {
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.black50,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.orange[400],
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
});
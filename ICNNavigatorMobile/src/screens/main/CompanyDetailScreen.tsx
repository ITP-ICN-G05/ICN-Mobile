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
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Company } from '../../types';
import { Colors, Spacing } from '../../constants/colors';
import { useUserTier } from '../../contexts/UserTierContext';

interface CompanyDetailScreenProps {
  route: any;
  navigation: any;
}

// Data validation utility
const isValidData = (value: any): boolean => {
  if (!value) return false;
  const stringValue = String(value).trim();
  return (
    stringValue !== '' &&
    stringValue !== '#N/A' &&
    stringValue !== '0' &&
    stringValue !== 'null' &&
    stringValue !== 'undefined' &&
    stringValue !== 'N/A' &&
    stringValue.toLowerCase() !== 'na'
  );
};

// Get display value with placeholder
const getDisplayValue = (
  value: string | number | undefined, 
  placeholder: string
): string => {
  if (isValidData(value)) {
    return String(value);
  }
  return placeholder;
};

export default function CompanyDetailScreen({ route, navigation }: CompanyDetailScreenProps) {
  const { company } = route.params as { company: Company };
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'projects'>('overview');
  const { features, currentTier } = useUserTier();
  const insets = useSafeAreaInsets();

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
      const capabilities = company.icnCapabilities 
        ? `\nCapabilities: ${company.icnCapabilities.slice(0, 3).map(c => c.itemName).join(', ')}` 
        : '';
      
      await Share.share({
        message: `Check out ${company.name} on ICN Navigator\n${company.address || 'Location available via ICN'}${capabilities}`,
        title: company.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Handle export based on tier
  const handleExport = () => {
    const exportType = currentTier === 'free' ? 'Basic' :
                      currentTier === 'plus' ? 'Limited' : 'Full';
    
    Alert.alert(
      `${exportType} Export`,
      `Export company information as:`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF', onPress: () => exportToPDF() },
        { text: 'Excel', onPress: () => exportToExcel() }
      ]
    );
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export based on tier
    Alert.alert('Export', 'PDF export feature coming soon');
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export based on tier
    Alert.alert('Export', 'Excel export feature coming soon');
  };

  // Handle ICN Chat (Plus/Premium only)
  const handleICNChat = () => {
    Linking.openURL('mailto:research@icn.vic.gov.au?subject=Inquiry about ' + company.name);
  };

  // Handle Gateway link (Plus/Premium only)
  const handleGatewayLink = () => {
    Linking.openURL('https://gateway.icn.org.au/project/search');
  };

  // Handle ICN Portal contact
  const handleICNContact = () => {
    Alert.alert(
      'Contact via ICN Portal',
      'This information is not directly available. Please contact the company through the ICN Portal for more details.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Visit ICN Portal', 
          onPress: () => Linking.openURL('https://icn.org.au/') 
        }
      ]
    );
  };

  // Handle directions
  const handleDirections = () => {
    if (company.latitude && company.longitude) {
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
    } else {
      Alert.alert(
        'Location Not Available',
        'Precise location is not available. Please check the address details or contact via ICN Portal.'
      );
    }
  };

  // Handle contact actions
  const handleEmail = () => {
    if (isValidData(company.email) && company.email) {
      Linking.openURL(`mailto:${company.email}`);
    } else {
      handleICNContact();
    }
  };

  const handleCall = () => {
    if (isValidData(company.phoneNumber) && company.phoneNumber) {
      const phoneNumber = company.phoneNumber.replace(/[^0-9]/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      handleICNContact();
    }
  };

  const handleWebsite = () => {
    if (isValidData(company.website) && company.website) {
      const url = company.website.startsWith('http') 
        ? company.website 
        : `https://${company.website}`;
      Linking.openURL(url);
    } else {
      handleICNContact();
    }
  };

  // Format display name
  const displayName = isValidData(company.name) && company.name !== 'Organisation Name' 
    ? company.name 
    : `Company ${company.id ? company.id.slice(-4) : 'Unknown'}`;

  // Get unique capability types
  const capabilityTypes = React.useMemo(() => {
    if (!company.icnCapabilities) return [];
    const types = new Set(company.icnCapabilities.map(cap => cap.capabilityType));
    return Array.from(types);
  }, [company.icnCapabilities]);

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
          <TouchableOpacity onPress={handleExport} style={styles.headerButton}>
            <Ionicons name="download-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        {/* News Tab - Available to all tiers */}
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'news' && styles.activeTab]}
          onPress={() => setActiveTab('news')}
        >
          <Text style={[styles.tabText, activeTab === 'news' && styles.activeTabText]}>
            News & Trends
          </Text>
        </TouchableOpacity>
        
        {/* Projects Tab - Premium only, shows only if data exists */}
        {currentTier === 'premium' && company.pastProjects && company.pastProjects.length > 0 && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
            onPress={() => setActiveTab('projects')}
          >
            <Text style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>
              Past Projects
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 }
        ]}
      >
        {activeTab === 'overview' ? (
          <>
            {/* Basic Company Info - Available to all tiers */}
            <View style={styles.card}>
              <View style={styles.companyHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.companyInfo}>
                  <Text style={styles.companyName}>{displayName}</Text>
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

              {/* Company Address - Basic tier */}
              {company.address && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color={Colors.black50} />
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>
                    {getDisplayValue(company.address, 'Address available via ICN')}
                  </Text>
                </View>
              )}

              {/* Sectors - Basic tier */}
              {company.keySectors && company.keySectors.length > 0 && (
                <View style={styles.sectorsContainer}>
                  <Text style={styles.sectionTitle}>Operating Sectors</Text>
                  <View style={styles.sectorsList}>
                    {company.keySectors.map((sector, index) => (
                      <View key={index} style={styles.sectorChip}>
                        <Text style={styles.sectorText}>{sector}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Items & Capabilities - Basic tier */}
            {company.icnCapabilities && company.icnCapabilities.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Items & Services ({company.icnCapabilities.length})
                </Text>
                {company.icnCapabilities.map((cap, index) => (
                  <View key={`${cap.capabilityId}-${index}`} style={styles.capabilityItem}>
                    <Text style={styles.capabilityName}>{cap.itemName}</Text>
                    {isValidData(cap.detailedItemName) && (
                      <Text style={styles.capabilityDetail}>{cap.detailedItemName}</Text>
                    )}
                    
                    {/* Capability Types - Plus tier only */}
                    {(currentTier === 'plus' || currentTier === 'premium') && (
                      <View style={styles.capabilityTypeBadge}>
                        <Text style={styles.capabilityTypeText}>{cap.capabilityType}</Text>
                      </View>
                    )}
                    
                    {/* Local Content % - Premium only */}
                    {currentTier === 'premium' && isValidData(company.localContentPercentage) && (
                      <Text style={styles.localContentText}>
                        Local Content: {company.localContentPercentage}%
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Contact Information - Basic tier */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contact Details</Text>
              
              {/* Website - Basic tier */}
              <TouchableOpacity 
                style={styles.contactRow} 
                onPress={isValidData(company.website) ? handleWebsite : handleICNContact}
              >
                <View style={[
                  styles.contactIcon,
                  !isValidData(company.website) && styles.contactIconDisabled
                ]}>
                  <Ionicons 
                    name="globe-outline" 
                    size={20} 
                    color={isValidData(company.website) ? Colors.primary : Colors.black50} 
                  />
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactLabel}>Website</Text>
                  <Text style={[
                    styles.contactValue,
                    !isValidData(company.website) && styles.placeholderText
                  ]}>
                    {getDisplayValue(company.website, 'Visit ICN Portal')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Phone - Basic tier */}
              <TouchableOpacity 
                style={styles.contactRow} 
                onPress={isValidData(company.phoneNumber) ? handleCall : handleICNContact}
              >
                <View style={[
                  styles.contactIcon,
                  !isValidData(company.phoneNumber) && styles.contactIconDisabled
                ]}>
                  <Ionicons 
                    name="call-outline" 
                    size={20} 
                    color={isValidData(company.phoneNumber) ? Colors.primary : Colors.black50} 
                  />
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={[
                    styles.contactValue,
                    !isValidData(company.phoneNumber) && styles.placeholderText
                  ]}>
                    {getDisplayValue(company.phoneNumber, 'Contact via ICN Portal')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Email - Basic tier */}
              <TouchableOpacity 
                style={styles.contactRow} 
                onPress={isValidData(company.email) ? handleEmail : handleICNContact}
              >
                <View style={[
                  styles.contactIcon,
                  !isValidData(company.email) && styles.contactIconDisabled
                ]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={isValidData(company.email) ? Colors.primary : Colors.black50} 
                  />
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={[
                    styles.contactValue,
                    !isValidData(company.email) && styles.placeholderText
                  ]}>
                    {getDisplayValue(company.email, 'Contact via ICN Portal')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Plus Tier Features */}
            {(currentTier === 'plus' || currentTier === 'premium') && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Company Information</Text>
                
                {/* ABN - Plus tier */}
                {isValidData(company.abn) && (
                  <View style={styles.infoRow}>
                    <Ionicons name="document-text-outline" size={20} color={Colors.black50} />
                    <Text style={styles.infoLabel}>ABN:</Text>
                    <Text style={styles.infoValue}>{company.abn}</Text>
                  </View>
                )}

                {/* Company Summary - Plus tier */}
                {isValidData(company.description) && (
                  <View style={styles.summaryContainer}>
                    <Text style={styles.sectionTitle}>Company Summary</Text>
                    <Text style={styles.summaryText}>{company.description}</Text>
                  </View>
                )}

                {/* ICN Chat - Plus tier */}
                <TouchableOpacity 
                  style={styles.actionRow}
                  onPress={handleICNChat}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name="chatbubbles-outline" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.actionText}>Chat with ICN Victoria</Text>
                  <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
                </TouchableOpacity>

                {/* Gateway Link - Plus tier */}
                <TouchableOpacity 
                  style={styles.actionRow}
                  onPress={handleGatewayLink}
                >
                  <View style={styles.actionIcon}>
                    <MaterialIcons name="launch" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.actionText}>View on Gateway by ICN</Text>
                  <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
                </TouchableOpacity>
              </View>
            )}

            {/* Premium Tier Features */}
            {currentTier === 'premium' && (
              <>
                {/* Business Metrics */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Business Metrics</Text>
                  
                  {/* Revenue */}
                  <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={20} color={Colors.black50} />
                    <Text style={styles.infoLabel}>Annual Revenue:</Text>
                    <Text style={[
                      styles.infoValue,
                      !isValidData(company.revenue) && styles.placeholderText
                    ]}>
                      {isValidData(company.revenue) && company.revenue
                        ? `$${company.revenue.toLocaleString()}` 
                        : 'Contact for details'
                      }
                    </Text>
                  </View>

                  {/* Employee Count */}
                  <View style={styles.infoRow}>
                    <Ionicons name="people-outline" size={20} color={Colors.black50} />
                    <Text style={styles.infoLabel}>Employees:</Text>
                    <Text style={[
                      styles.infoValue,
                      !isValidData(company.employeeCount) && styles.placeholderText
                    ]}>
                      {isValidData(company.employeeCount) && company.employeeCount
                        ? company.employeeCount.toLocaleString() 
                        : 'Contact for details'
                      }
                    </Text>
                  </View>
                </View>

                {/* Diversity & Certifications */}
                {((company.ownershipType && company.ownershipType.length > 0) || 
                  (company.certifications && company.certifications.length > 0) ||
                  company.socialEnterprise || 
                  company.australianDisabilityEnterprise) && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Certifications & Diversity</Text>
                    
                    {/* Diversity Markers */}
                    {company.ownershipType && company.ownershipType.length > 0 && (
                      <View style={styles.badgesContainer}>
                        <Text style={styles.sectionTitle}>Ownership</Text>
                        <View style={styles.badgesList}>
                          {company.ownershipType.map((ownership, index) => (
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
                    {company.certifications && company.certifications.length > 0 && (
                      <View style={styles.certificationsContainer}>
                        <Text style={styles.sectionTitle}>Certifications</Text>
                        <View style={styles.certificationsList}>
                          {company.certifications.map((cert, index) => (
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
            )}

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
                <Ionicons name="navigate" size={24} color={Colors.white} />
                <Text style={styles.actionButtonText}>Directions</Text>
              </TouchableOpacity>
              
              {(currentTier === 'plus' || currentTier === 'premium') && (
                <TouchableOpacity style={styles.actionButton} onPress={handleICNChat}>
                  <Ionicons name="chatbubbles" size={24} color={Colors.white} />
                  <Text style={styles.actionButtonText}>Chat ICN</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
                <Ionicons name="download" size={24} color={Colors.white} />
                <Text style={styles.actionButtonText}>
                  {currentTier === 'free' ? 'Basic' : currentTier === 'plus' ? 'Limited' : 'Full'} Export
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : activeTab === 'news' ? (
          /* News & Trends Tab Content */
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Industry News & Trends</Text>
            <View style={styles.newsContainer}>
              <Text style={styles.newsPlaceholder}>
                ICN Victoria Industry Research Team's thought leadership articles and trends for the {company.keySectors[0]} sector will appear here.
              </Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => Linking.openURL('https://icn.org.au/news')}
              >
                <Text style={styles.viewAllText}>View All ICN News</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : activeTab === 'projects' && currentTier === 'premium' ? (
          /* Past Projects Tab Content - Premium only */
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Past Projects</Text>
            {company.pastProjects && company.pastProjects.length > 0 ? (
              <ScrollView style={styles.projectsContainer}>
                {company.pastProjects.map((project, index) => (
                  <View key={project.id || index} style={styles.projectItem}>
                    <View style={styles.projectHeader}>
                      <Text style={styles.projectName}>{project.name}</Text>
                      <Text style={styles.projectDate}>{project.date}</Text>
                    </View>
                    {project.client && (
                      <Text style={styles.projectClient}>Client: {project.client}</Text>
                    )}
                    {project.description && (
                      <Text style={styles.projectDescription}>{project.description}</Text>
                    )}
                    {project.value && (
                      <Text style={styles.projectValue}>Value: ${project.value.toLocaleString()}</Text>
                    )}
                    {project.outcome && (
                      <View style={styles.projectOutcome}>
                        <Text style={styles.projectOutcomeLabel}>Outcome:</Text>
                        <Text style={styles.projectOutcomeText}>{project.outcome}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noDataText}>No past projects available</Text>
            )}
          </View>
        ) : null}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.black50,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
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
    marginBottom: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
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
    flex: 1,
  },
  placeholderText: {
    fontStyle: 'italic',
    color: Colors.black50,
  },
  sectorsContainer: {
    marginTop: 12,
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
  capabilityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  capabilityName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  capabilityDetail: {
    fontSize: 13,
    color: Colors.black50,
    marginBottom: 4,
  },
  capabilityTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  capabilityTypeText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '600',
  },
  localContentText: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 4,
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
  contactIconDisabled: {
    backgroundColor: '#F0F0F0',
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
  summaryContainer: {
    marginTop: 12,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.black20,
    marginTop: 8,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.orange[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  badgesContainer: {
    marginBottom: 12,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  diversityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  badgeRow: {
    marginVertical: 8,
  },
  specialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  specialBadgeText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  certificationsContainer: {
    marginTop: 12,
  },
  certificationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  certificationText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
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
    fontSize: 11,
    color: Colors.white,
    fontWeight: '500',
    textAlign: 'center',
  },
  newsContainer: {
    padding: 16,
  },
  newsPlaceholder: {
    fontSize: 14,
    color: Colors.black50,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.orange[400],
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  projectsContainer: {
    maxHeight: 400,
  },
  projectItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  projectDate: {
    fontSize: 12,
    color: Colors.black50,
  },
  projectClient: {
    fontSize: 13,
    color: Colors.black50,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  projectDescription: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginVertical: 4,
  },
  projectValue: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
    marginTop: 4,
  },
  projectOutcome: {
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.orange[400],
    borderRadius: 6,
  },
  projectOutcomeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.black50,
    marginBottom: 2,
  },
  projectOutcomeText: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 16,
  },
  noDataText: {
    fontSize: 14,
    color: Colors.black50,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});
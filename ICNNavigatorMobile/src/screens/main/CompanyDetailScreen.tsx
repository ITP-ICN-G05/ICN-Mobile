import React, { useState, useEffect } from 'react';
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
  Alert,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Company } from '../../types';
import { Colors, Spacing } from '../../constants/colors';
import { useUserTier } from '../../contexts/UserTierContext';
import { hybridDataService } from '../../services/hybridDataService';

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
  const { company: initialCompany } = route.params as { company: Company };
  
  // ✅ Use state to manage company data
  const [company, setCompany] = useState<Company>(initialCompany);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const [isNewsExpanded, setIsNewsExpanded] = useState(false);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const [isContactExpanded, setIsContactExpanded] = useState(false);
  const [isCompanyInfoExpanded, setIsCompanyInfoExpanded] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentProjectPage, setCurrentProjectPage] = useState(0);
  const { features, currentTier } = useUserTier();
  const insets = useSafeAreaInsets();

  // ✅ Refetch full data on mount
  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      // If already has capabilities, no need to refetch
      if (initialCompany.icnCapabilities && initialCompany.icnCapabilities.length > 0) {
        console.log('[CompanyDetailScreen] Using existing capabilities, skip fetch');
        return;
      }

      // Must have organizationId to fetch details
      if (!initialCompany.organizationId) {
        console.warn('[CompanyDetailScreen] No organizationId, cannot fetch details');
        return;
      }

      try {
        setLoading(true);
        console.log('[CompanyDetailScreen] Fetching details for:', initialCompany.organizationId);
        
        const detailedCompany = await hybridDataService.fetchCompanyDetailsById(
          initialCompany.organizationId,
          'default_user'  // TODO: Get real userId from UserContext
        );

        if (isMounted && detailedCompany) {
          console.log('[CompanyDetailScreen] Fetched capabilities:', detailedCompany.icnCapabilities?.length);
          
          // Merge data: keep existing basic info, update capabilities
          setCompany(prev => ({
            ...prev,
            ...detailedCompany,
            icnCapabilities: detailedCompany.icnCapabilities,
            capabilities: detailedCompany.capabilities,
            keySectors: detailedCompany.keySectors,
            // Include mock data
            abn: detailedCompany.abn,
            employeeCount: detailedCompany.employeeCount,
            revenue: detailedCompany.revenue,
            diversityMarkers: detailedCompany.diversityMarkers,
            ownershipType: detailedCompany.ownershipType,
            socialEnterprise: detailedCompany.socialEnterprise,
            australianDisabilityEnterprise: detailedCompany.australianDisabilityEnterprise,
            certifications: detailedCompany.certifications,
            localContentPercentage: detailedCompany.localContentPercentage,
            description: detailedCompany.description,
          }));
        }
      } catch (error) {
        console.error('[CompanyDetailScreen] Failed to fetch company details:', error);
        if (isMounted) {
          setLoadError('Failed to load company details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [initialCompany.id, initialCompany.organizationId]);

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // ✅ Add debug logging
  useEffect(() => {
    console.log('[CompanyDetailScreen] Company data:', {
      id: company.id,
      name: company.name,
      organizationId: company.organizationId,
      hasIcnCapabilities: !!company.icnCapabilities,
      capabilitiesLength: company.icnCapabilities?.length || 0,
      sampleCapability: company.icnCapabilities?.[0],
      hasMockData: {
        abn: !!company.abn,
        employeeCount: !!company.employeeCount,
        revenue: !!company.revenue,
        certifications: !!company.certifications,
        diversityMarkers: !!company.diversityMarkers
      }
    });
  }, [company]);

  // ✅ Show loading indicator
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={1}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Company Details</Text>
          </View>
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 16, color: Colors.black50 }}>Loading details...</Text>
        </View>
      </View>
    );
  }

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

  // Adaptive pagination logic for Items & Services
  const screenHeight = Dimensions.get('window').height;
  const availableHeight = screenHeight - 400; // Reserve space for header, company info, other sections
  const itemHeight = 80; // Approximate height of each capability item
  const itemsPerPage = Math.max(3, Math.floor(availableHeight / itemHeight)); // Minimum 3 items, adaptive based on screen
  const totalPages = company.icnCapabilities ? Math.ceil(company.icnCapabilities.length / itemsPerPage) : 0;
  const currentItems = company.icnCapabilities ? 
    company.icnCapabilities.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage) : [];

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Project pagination logic
  const projectsData = company.pastProjects || [
    { id: 1, name: 'Melbourne Infrastructure Project', client: 'VicRoads', date: '2023', description: 'Major highway construction with 85% local content', value: '$2.5M', duration: '18 months' },
    { id: 2, name: 'Sydney Harbour Bridge Maintenance', client: 'Transport NSW', date: '2022', description: 'Structural maintenance and safety upgrades', value: '$1.8M', duration: '12 months' },
    { id: 3, name: 'Brisbane Airport Expansion', client: 'Brisbane Airport Corporation', date: '2021', description: 'Terminal expansion with sustainable materials', value: '$4.2M', duration: '24 months' }
  ];
  const projectsPerPage = 3;
  const totalProjectPages = Math.ceil(projectsData.length / projectsPerPage);
  const currentProjects = projectsData.slice(currentProjectPage * projectsPerPage, (currentProjectPage + 1) * projectsPerPage);

  const handleNextProjectPage = () => {
    if (currentProjectPage < totalProjectPages - 1) {
      setCurrentProjectPage(currentProjectPage + 1);
    }
  };

  const handlePrevProjectPage = () => {
    if (currentProjectPage > 0) {
      setCurrentProjectPage(currentProjectPage - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Logo */}
      <Image 
        source={require('../../../assets/ICN Logo Source/ICN-logo-little.png')} 
        style={styles.backgroundLogo}
        resizeMode="cover"
        onError={(error) => console.log('Background logo load error:', error)}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={1}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Company Details</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton} activeOpacity={1}>
            <Ionicons name="share-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>


      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 }
        ]}
      >
            {/* Basic Company Info - Available to all tiers */}
            <View style={styles.card}>
              <View style={styles.companyHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.companyInfo}>
                  <View style={styles.companyNameRow}>
                    <Text style={styles.companyName}>{displayName}</Text>
                    <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkButton} activeOpacity={1}>
                      <Ionicons 
                        name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                        size={24} 
                        color={isBookmarked ? Colors.primary : Colors.black50} 
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

               {/* Company Address - Basic tier */}
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

               {/* Company ABN - Plus tier and above */}
               {(currentTier === 'plus' || currentTier === 'premium') && (company.abn || true) && (
                 <View style={styles.sectorsContainer}>
                   <View style={styles.sectionTitleRow}>
                     <Ionicons name="document-text-outline" size={20} color={Colors.black50} />
                     <Text style={styles.sectionTitle}>Company ABN</Text>
                   </View>
                   <View style={styles.abnContainer}>
                     <Text style={styles.abnText}>
                       {(() => {
                         const abnNumber = company.abn || '12345678901';
                         return `${abnNumber.slice(0, 2)} ${abnNumber.slice(2)}`;
                       })()}
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
                       onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
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
                     {(company.diversityMarkers || ['Australian Disability Enterprise', 'Female Owned Business']).map((marker, index) => (
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
                     {(company.certifications || ['Australian-made Certification', 'ISO 9001', 'Australian Standards']).map((cert, index) => (
                       <View key={index} style={styles.certificationChip}>
                         <Ionicons name="medal-outline" size={14} color={Colors.primary} />
                         <Text style={styles.certificationText}>{cert}</Text>
                       </View>
                     ))}
                   </View>
                 </View>
               )}

               {/* Sectors - Basic tier */}
               {company.keySectors && company.keySectors.length > 0 && (
                 <View style={styles.sectorsContainer}>
                   <View style={styles.sectionTitleRow}>
                     <Ionicons name="business-outline" size={20} color={Colors.black50} />
                     <Text style={styles.sectionTitle}>Operating Sectors</Text>
                   </View>
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

            {/* Items & Capabilities - Basic tier - Collapsible */}
            {company.icnCapabilities && company.icnCapabilities.length > 0 && (
              <View style={styles.card}>
                 <TouchableOpacity
                   style={styles.collapsibleHeader}
                   onPress={() => setIsItemsExpanded(!isItemsExpanded)}
                   activeOpacity={1}
                 >
                   <View style={styles.titleWithBadge}>
                     <Text style={styles.cardTitleStyled}>Items & Services</Text>
                     <View style={styles.itemsCountBadge}>
                       <Text style={styles.itemsCountBadgeText}>
                         {totalPages > 1 && isItemsExpanded 
                           ? `${Math.min((currentPage + 1) * itemsPerPage, company.icnCapabilities.length)}/${company.icnCapabilities.length}`
                           : `${company.icnCapabilities.length}`
                         }
                       </Text>
                     </View>
                   </View>
                   <Ionicons
                     name={isItemsExpanded ? "chevron-up" : "chevron-down"}
                     size={20} 
                     color={Colors.black50} 
                   />
                 </TouchableOpacity>
                
                 {isItemsExpanded && (
                   <View style={styles.collapsibleContent}>
                     {/* Top Pagination Controls */}
                     {totalPages > 1 && (
                       <View style={styles.horizontalPaginationWrapper}>
                         <View style={styles.horizontalPaginationContainer}>
                           <TouchableOpacity 
                             style={[styles.separatedNavButton, currentPage === 0 && styles.separatedNavButtonDisabled]}
                             onPress={handlePrevPage}
                             disabled={currentPage === 0}
                             activeOpacity={1}
                           >
                             <Ionicons 
                               name="chevron-back" 
                               size={16} 
                               color={currentPage === 0 ? Colors.black50 : Colors.primary} 
                             />
                           </TouchableOpacity>
                           
                           <View style={styles.extendedPageDotsContainer}>
                             {Array.from({ length: totalPages }, (_, index) => (
                               <TouchableOpacity
                                 key={index}
                                 style={[
                                   styles.compactPageDot,
                                   index === currentPage && styles.compactPageDotActive
                                 ]}
                                 onPress={() => setCurrentPage(index)}
                                 activeOpacity={1}
                               />
                             ))}
                           </View>
                           
                           <TouchableOpacity 
                             style={[styles.separatedNavButton, currentPage === totalPages - 1 && styles.separatedNavButtonDisabled]}
                             onPress={handleNextPage}
                             disabled={currentPage === totalPages - 1}
                             activeOpacity={1}
                           >
                             <Ionicons 
                               name="chevron-forward" 
                               size={16} 
                               color={currentPage === totalPages - 1 ? Colors.black50 : Colors.primary} 
                             />
                           </TouchableOpacity>
                         </View>
                       </View>
                     )}
                     
                     {/* Current Page Items */}
                     {currentItems.map((cap, index) => (
                       <View key={`${cap.capabilityId}-${currentPage}-${index}`} style={styles.modernCapabilityItem}>
                         <View style={styles.capabilityHeader}>
                           <View style={styles.capabilityIcon}>
                             <Ionicons name="cube-outline" size={18} color={Colors.primary} />
                           </View>
                           <View style={styles.capabilityContent}>
                             <Text style={styles.modernCapabilityName}>{cap.itemName}</Text>
                             {isValidData(cap.detailedItemName) && (
                               <Text style={styles.modernCapabilityDetail}>{cap.detailedItemName}</Text>
                             )}
                           </View>
                         </View>
                         
                         {/* Tags Row */}
                         <View style={styles.capabilityTags}>
                           {/* Capability Types - Plus tier only */}
                           {(currentTier === 'plus' || currentTier === 'premium') && (
                             <View style={styles.modernCapabilityTypeBadge}>
                               <Text style={styles.modernCapabilityTypeText}>{cap.capabilityType}</Text>
                             </View>
                           )}
                           
                           {/* Local Content % - Premium only */}
                           {currentTier === 'premium' && cap.localContentPercentage && (
                             <View style={styles.localContentBadge}>
                               <Text style={styles.localContentBadgeText}>
                                 {cap.localContentPercentage}% Local
                               </Text>
                             </View>
                           )}
                         </View>
                       </View>
                     ))}
                     
                   </View>
                 )}
                
                {/* Show preview when collapsed */}
                {!isItemsExpanded && (
                  <View style={styles.previewContainer}>
                    <View style={styles.previewTags}>
                      {company.icnCapabilities.slice(0, 3).map((cap, index) => (
                        <View key={index} style={styles.previewTag}>
                          <Text style={styles.previewTagText}>{cap.itemName}</Text>
                        </View>
                      ))}
                      {company.icnCapabilities.length > 3 && (
                        <View style={styles.moreTag}>
                          <Text style={styles.moreTagText}>+{company.icnCapabilities.length - 3} more</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* News & Trends - Collapsible Block */}
            <View style={styles.card}>
              <TouchableOpacity 
                style={styles.collapsibleHeader}
                onPress={() => setIsNewsExpanded(!isNewsExpanded)}
                activeOpacity={1}
              >
                <View style={styles.clickableCardLeft}>
                  <Ionicons name="newspaper-outline" size={24} color={Colors.primary} />
                  <View style={styles.clickableCardText}>
                    <Text style={styles.clickableCardTitle}>Industry News & Trends</Text>
                    <Text style={styles.clickableCardSubtitle}>
                      ICN Victoria research and insights for {company.keySectors?.[0] || 'your industry'}
                    </Text>
                  </View>
                </View>
                <Ionicons 
                  name={isNewsExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={Colors.black50} 
                />
              </TouchableOpacity>
              
              {isNewsExpanded && (
                <View style={styles.collapsibleContent}>
                  <View style={styles.newsContainer}>
                    <Text style={styles.newsPlaceholder}>
                      ICN Victoria Industry Research Team's thought leadership articles and trends for the {company.keySectors?.[0] || 'industry'} sector will appear here.
                    </Text>
                    <TouchableOpacity 
                      style={styles.viewAllButton}
                      onPress={() => Linking.openURL('https://icn.org.au/news')}
                      activeOpacity={1}
                    >
                      <Text style={styles.viewAllText}>View All ICN News</Text>
                      <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Past Projects - Premium only, collapsible block */}
            {currentTier === 'premium' && projectsData.length > 0 && (
              <View style={styles.card}>
                <TouchableOpacity 
                  style={styles.collapsibleHeader}
                  onPress={() => setIsProjectsExpanded(!isProjectsExpanded)}
                  activeOpacity={1}
                >
                  <View style={styles.clickableCardLeft}>
                    <Ionicons name="briefcase-outline" size={24} color={Colors.primary} />
                    <View style={styles.clickableCardText}>
                      <Text style={styles.clickableCardTitle}>Past Projects</Text>
                      <Text style={styles.clickableCardSubtitle}>
                        View {projectsData.length} completed projects and outcomes
                      </Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={isProjectsExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={Colors.black50} 
                  />
                </TouchableOpacity>
                
                {isProjectsExpanded && (
                  <View style={styles.collapsibleContent}>
                    <View style={styles.projectsContainer}>
                      {currentProjects.map((project, index) => (
                        <View key={project.id || index} style={styles.modernProjectItem}>
                          <View style={styles.projectMainInfo}>
                            <Text style={styles.projectName}>{project.name}</Text>
                            <Text style={styles.projectDescription}>{project.description}</Text>
                          </View>
                          
                          <View style={styles.projectTags}>
                            <View style={styles.projectClientBadge}>
                              <Ionicons name="business-outline" size={12} color={Colors.primary} />
                              <Text style={styles.projectClientText}>{project.client}</Text>
                            </View>
                            
                            <View style={styles.projectDateBadge}>
                              <Ionicons name="calendar-outline" size={12} color={Colors.black50} />
                              <Text style={styles.projectDateText}>{project.date}</Text>
                            </View>
                            
                            {project.value && (
                              <View style={styles.projectValueBadge}>
                                <Ionicons name="cash-outline" size={12} color={Colors.success} />
                                <Text style={styles.projectValueText}>{project.value}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                    
                    {/* Project Pagination */}
                    {totalProjectPages > 1 && (
                      <View style={styles.horizontalPaginationWrapper}>
                        <View style={styles.horizontalPaginationContainer}>
                          <TouchableOpacity 
                            style={[styles.separatedNavButton, currentProjectPage === 0 && styles.separatedNavButtonDisabled]}
                            onPress={handlePrevProjectPage}
                            disabled={currentProjectPage === 0}
                            activeOpacity={1}
                          >
                            <Ionicons 
                              name="chevron-back" 
                              size={16} 
                              color={currentProjectPage === 0 ? Colors.black50 : Colors.primary} 
                            />
                          </TouchableOpacity>
                          
                          <View style={styles.extendedPageDotsContainer}>
                            {Array.from({ length: totalProjectPages }, (_, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.compactPageDot,
                                  index === currentProjectPage && styles.compactPageDotActive
                                ]}
                                onPress={() => setCurrentProjectPage(index)}
                                activeOpacity={1}
                              />
                            ))}
                          </View>
                          
                          <TouchableOpacity 
                            style={[styles.separatedNavButton, currentProjectPage === totalProjectPages - 1 && styles.separatedNavButtonDisabled]}
                            onPress={handleNextProjectPage}
                            disabled={currentProjectPage === totalProjectPages - 1}
                            activeOpacity={1}
                          >
                            <Ionicons 
                              name="chevron-forward" 
                              size={16} 
                              color={currentProjectPage === totalProjectPages - 1 ? Colors.black50 : Colors.primary} 
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Contact Information - Basic tier */}
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.collapsibleHeader}
                onPress={() => setIsContactExpanded(!isContactExpanded)}
                activeOpacity={1}
              >
                <View style={styles.titleWithBadge}>
                  <Text style={styles.cardTitleStyled}>Contact Details</Text>
                </View>
                <Ionicons
                  name={isContactExpanded ? "chevron-up" : "chevron-down"}
                  size={20} 
                  color={Colors.black50} 
                />
              </TouchableOpacity>

              {isContactExpanded && (
                <View style={styles.collapsibleContent}>
              
              {/* Website - Basic tier */}
              <TouchableOpacity 
                style={styles.contactRow} 
                onPress={isValidData(company.website) ? handleWebsite : handleICNContact}
                activeOpacity={1}
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
                activeOpacity={1}
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
                activeOpacity={1}
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
              )}
            </View>

            {/* Plus Tier Features */}
            {(currentTier === 'plus' || currentTier === 'premium') && (
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.collapsibleHeader}
                  onPress={() => setIsCompanyInfoExpanded(!isCompanyInfoExpanded)}
                  activeOpacity={1}
                >
                  <View style={styles.titleWithBadge}>
                    <Text style={styles.cardTitleStyled}>Company Information</Text>
                  </View>
                  <Ionicons
                    name={isCompanyInfoExpanded ? "chevron-up" : "chevron-down"}
                    size={20} 
                    color={Colors.black50} 
                  />
                </TouchableOpacity>

                {isCompanyInfoExpanded && (
                  <View style={styles.collapsibleContent}>
                
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
                  activeOpacity={1}
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
                  activeOpacity={1}
                >
                  <View style={styles.actionIcon}>
                    <MaterialIcons name="launch" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.actionText}>View on Gateway by ICN</Text>
                  <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
                </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Premium Tier Features */}
            {currentTier === 'premium' && (
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
                        !isValidData(company.revenue) && styles.metricPlaceholder
                      ]}>
                        {isValidData(company.revenue) && company.revenue
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
                        !isValidData(company.employeeCount) && styles.metricPlaceholder
                      ]}>
                        {isValidData(company.employeeCount) && company.employeeCount
                          ? `${company.employeeCount.toLocaleString()} employees` 
                          : 'Contact for details'
                        }
                      </Text>
                    </View>
                  </View>

                  {/* Additional Metrics Row */}
                  <View style={styles.additionalMetricsContainer}>
                    {/* Local Content Percentage */}
                    {isValidData(company.localContentPercentage) && (
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
            <View style={styles.modernQuickActions}>
              <TouchableOpacity style={styles.modernActionButton} onPress={handleDirections} activeOpacity={1}>
                <View style={styles.modernActionIconContainer}>
                  <Ionicons name="navigate" size={22} color={Colors.primary} />
                </View>
                <Text style={styles.modernActionButtonText}>Get Directions</Text>
                <Text style={styles.modernActionButtonSubtext}>Navigate to location</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modernActionButton} 
                onPress={(currentTier === 'plus' || currentTier === 'premium') ? handleICNChat : () => Alert.alert('Upgrade Required', 'Chat with ICN is available for Plus and Premium users.')}
                activeOpacity={1}
              >
                <View style={styles.modernActionIconContainer}>
                  <Ionicons name="chatbubbles" size={22} color={Colors.success} />
                </View>
                <Text style={styles.modernActionButtonText}>Chat with ICN</Text>
                <Text style={styles.modernActionButtonSubtext}>
                  {(currentTier === 'plus' || currentTier === 'premium') ? 'Get expert support' : 'Upgrade to unlock'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modernActionButton} onPress={handleExport} activeOpacity={1}>
                <View style={styles.modernActionIconContainer}>
                  <Ionicons name="download" size={22} color={Colors.primary} />
                </View>
                <Text style={styles.modernActionButtonText}>Export Data</Text>
                <Text style={styles.modernActionButtonSubtext}>
                  {currentTier === 'free' ? 'Basic info' : currentTier === 'plus' ? 'Limited data' : 'Complete profile'}
                </Text>
              </TouchableOpacity>
            </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light background color for better semi-transparent effect
  },
  backgroundLogo: {
    position: 'absolute',
    top: 150,
    left: -100,
    right: 0,
    bottom: 0,
    width: 530,
    height: 530,
    opacity: 0.15, // Increased transparency for subtle background
  },
  header: {
    backgroundColor: '#F8B657', // Orange color consistent with companies page header
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced vertical padding for closer title spacing
    paddingTop: Platform.OS === 'ios' ? 48 : StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Take up left side space
  },
  backButton: {
    padding: 2, // Reduced padding for smaller arrow container
  },
  headerTitle: {
    fontSize: 18, // Adjusted to smaller font size
    fontWeight: '700', // Bold weight consistent with companies page
    color: '#FFFFFF', // White text consistent with companies page
    marginLeft: 8, // Small spacing between arrow and title
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8, // Reduced button spacing
  },
  headerButton: {
    padding: 2, // Reduced button padding consistent with back button
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white background
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)', // Subtle border
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // Spacing between title and badge
  },
  cardTitleStyled: {
    fontSize: 18,
    fontWeight: '700', // Bolder font weight
    color: Colors.text, // Keep original text color
    letterSpacing: 0.3, // Slight letter spacing
  },
  countBadge: {
    backgroundColor: Colors.success, // Use verified green background
    width: 24,
    height: 24,
    borderRadius: 12, // Fully circular
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700', // Bold numbers
    color: Colors.white, // White text
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bookmarkButton: {
    padding: 4,
    marginLeft: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.black50,
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
    alignItems: 'flex-start', // Left align company info
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Name left, bookmark right
    width: '100%',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'left', // Left align company name
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    justifyContent: 'flex-start', // Left align verified badge
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Right align entire row
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
    textAlign: 'right', // Right align text
    maxWidth: '60%', // Limit max width to avoid overflow
  },
  placeholderText: {
    fontStyle: 'italic',
    color: Colors.black50,
  },
  sectorsContainer: {
    marginTop: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black50,
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
  modernCapabilityItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)', // Further increased transparency (2%)
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5, // More visible border
    borderColor: 'rgba(248, 182, 87, 0.3)', // Orange border for better visibility
  },
  capabilityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  capabilityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.orange[400],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  capabilityContent: {
    flex: 1,
  },
  modernCapabilityName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 22,
  },
  modernCapabilityDetail: {
    fontSize: 14,
    color: Colors.black50,
    lineHeight: 20,
    marginBottom: 2,
  },
  capabilityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  modernCapabilityTypeBadge: {
    backgroundColor: 'rgba(248, 182, 87, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernCapabilityTypeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
  localContentBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  localContentBadgeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
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
  clickableCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white background
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)', // Subtle border
  },
  clickableCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  clickableCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clickableCardText: {
    marginLeft: 12,
    flex: 1,
  },
  clickableCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  clickableCardSubtitle: {
    fontSize: 14,
    color: Colors.black50,
    lineHeight: 20,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  collapsibleContent: {
    marginTop: 8,
  },
  previewContainer: {
    marginTop: 12,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewTag: {
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewTagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  moreTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moreTagText: {
    fontSize: 12,
    color: Colors.black50,
    fontWeight: '500',
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
  paginationContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(248, 182, 87, 0.2)',
    gap: 16,
  },
  pageDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(248, 182, 87, 0.3)',
  },
  pageDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
    borderRadius: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 182, 87, 0.1)',
    borderRadius: 20,
    padding: 4,
    gap: 12,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  pageInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 40,
    justifyContent: 'center',
  },
  pageNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  totalPages: {
    fontSize: 14,
    color: Colors.black50,
    fontWeight: '500',
  },
  itemsCount: {
    fontSize: 12,
    color: Colors.black50,
    textAlign: 'center',
  },
  bottomPagination: {
    borderTopColor: 'rgba(248, 182, 87, 0.2)',
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 0,
  },
  simplePaginationContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  compactPagination: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 182, 87, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 12,
  },
  compactNavButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(248, 182, 87, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactNavButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  compactPageDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactPageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(248, 182, 87, 0.4)',
  },
  compactPageDotActive: {
    backgroundColor: Colors.primary,
    width: 18,
    borderRadius: 3,
  },
  separatedPaginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  separatedNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(248, 182, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248, 182, 87, 0.3)',
  },
  separatedNavButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  centerPageDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(248, 182, 87, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  adaptivePaginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  adaptivePageInfo: {
    alignItems: 'center',
    gap: 8,
  },
  adaptivePageText: {
    fontSize: 11,
    color: Colors.black50,
    fontWeight: '500',
  },
  horizontalPaginationWrapper: {
    marginVertical: 16,
  },
  horizontalPaginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  extendedPageDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(248, 182, 87, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
  },
  inlinePaginationItemCount: {
    fontSize: 11,
    color: Colors.black50,
    fontWeight: '500',
    minWidth: 80,
    textAlign: 'right',
  },
  itemsCountBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsCountBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(248, 182, 87, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248, 182, 87, 0.15)',
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.black50,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  metricPlaceholder: {
    fontSize: 12,
    color: Colors.black50,
    fontStyle: 'italic',
  },
  additionalMetricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  additionalMetricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  additionalMetricIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  additionalMetricText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  modernQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
    gap: 12,
  },
  modernActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248, 182, 87, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modernActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(248, 182, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  modernActionButtonSubtext: {
    fontSize: 11,
    color: Colors.black50,
    textAlign: 'center',
    lineHeight: 14,
  },
  abnContainer: {
    backgroundColor: 'rgba(248, 182, 87, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 182, 87, 0.2)',
  },
  abnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 20,
  },
  summaryToggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    marginTop: 6,
  },
  diversityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  diversityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    gap: 6,
  },
  diversityText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  certificationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 182, 87, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(248, 182, 87, 0.3)',
    gap: 6,
  },
  modernProjectItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(248, 182, 87, 0.3)',
  },
  projectMainInfo: {
    marginBottom: 12,
  },
  projectTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  projectClientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 182, 87, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 182, 87, 0.3)',
    gap: 4,
  },
  projectClientText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  projectDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    gap: 4,
  },
  projectDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.black50,
  },
  projectValueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    gap: 4,
  },
  projectValueText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
});
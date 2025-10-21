import { useState, useEffect, useMemo } from 'react';
import { Alert, Linking, Share, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserTier } from '@/contexts/UserTierContext';
import { useBookmark } from '@/contexts/BookmarkContext';
import { hybridDataService } from '@/services/hybridDataService';
import { Company } from '@/types';
import { groupCapabilities } from '../utils';

export const useCompanyDetail = (route: any, navigation: any) => {
  const { company: initialCompany } = route.params as { company: Company };
  
  const [company, setCompany] = useState<Company>(initialCompany);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const { isBookmarked, toggleBookmark } = useBookmark();
  const { currentTier } = useUserTier();
  const insets = useSafeAreaInsets();

  // Expand/collapse states
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const [isNewsExpanded, setIsNewsExpanded] = useState(false);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const [isContactExpanded, setIsContactExpanded] = useState(false);
  const [isCompanyInfoExpanded, setIsCompanyInfoExpanded] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [currentProjectPage, setCurrentProjectPage] = useState(0);
  
  // Expand/collapse state for capability groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Fetch company details
  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (initialCompany.icnCapabilities && initialCompany.icnCapabilities.length > 0) {
        console.log('[CompanyDetailScreen] Using existing capabilities, skip fetch');
        return;
      }

      if (!initialCompany.organizationId) {
        console.warn('[CompanyDetailScreen] No organizationId, cannot fetch details');
        return;
      }

      try {
        setLoading(true);
        console.log('[CompanyDetailScreen] Fetching details for:', initialCompany.organizationId);
        
        const detailedCompany = await hybridDataService.fetchCompanyDetailsById(
          initialCompany.organizationId,
          'default_user'
        );

        if (isMounted && detailedCompany) {
          console.log('[CompanyDetailScreen] Fetched capabilities:', detailedCompany.icnCapabilities?.length);
          
          setCompany(prev => ({
            ...prev,
            ...detailedCompany,
            icnCapabilities: detailedCompany.icnCapabilities,
            capabilities: detailedCompany.capabilities,
            keySectors: detailedCompany.keySectors,
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

  // Group capabilities
  const groupedCapabilities = useMemo(() => {
    return groupCapabilities(company.icnCapabilities);
  }, [company.icnCapabilities]);

  // Adaptive pagination for capabilities
  const screenHeight = Dimensions.get('window').height;
  const availableHeight = screenHeight - 400;
  const itemHeight = 80;
  const itemsPerPage = Math.max(3, Math.floor(availableHeight / itemHeight));
  
  const totalPages = Math.ceil(groupedCapabilities.length / itemsPerPage);
  const currentGroups = groupedCapabilities.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  );

  // Project data
  const projectsData = company.pastProjects || [
    { id: 1, name: 'Melbourne Infrastructure Project', client: 'VicRoads', date: '2023', description: 'Major highway construction with 85% local content', value: '$2.5M', duration: '18 months' },
    { id: 2, name: 'Sydney Harbour Bridge Maintenance', client: 'Transport NSW', date: '2022', description: 'Structural maintenance and safety upgrades', value: '$1.8M', duration: '12 months' },
    { id: 3, name: 'Brisbane Airport Expansion', client: 'Brisbane Airport Corporation', date: '2021', description: 'Terminal expansion with sustainable materials', value: '$4.2M', duration: '24 months' }
  ];

  const projectsPerPage = 3;
  const totalProjectPages = Math.ceil(projectsData.length / projectsPerPage);
  const currentProjects = projectsData.slice(
    currentProjectPage * projectsPerPage, 
    (currentProjectPage + 1) * projectsPerPage
  );

  // Handlers
  const handleBack = () => {
    navigation.goBack();
  };

  const handleBookmark = async () => {
    await toggleBookmark(company.id);
  };

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
    Alert.alert('Export', 'PDF export feature coming soon');
  };

  const exportToExcel = () => {
    Alert.alert('Export', 'Excel export feature coming soon');
  };

  const handleICNChat = () => {
    Linking.openURL('mailto:research@icn.vic.gov.au?subject=Inquiry about ' + company.name);
  };

  const handleGatewayLink = () => {
    Linking.openURL('https://gateway.icn.org.au/project/search');
  };

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

  const handleEmail = () => {
    if (company.email) {
      Linking.openURL(`mailto:${company.email}`);
    } else {
      handleICNContact();
    }
  };

  const handleCall = () => {
    if (company.phoneNumber) {
      const phoneNumber = company.phoneNumber.replace(/[^0-9]/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      handleICNContact();
    }
  };

  const handleWebsite = () => {
    if (company.website) {
      const url = company.website.startsWith('http') 
        ? company.website 
        : `https://${company.website}`;
      Linking.openURL(url);
    } else {
      handleICNContact();
    }
  };

  const toggleGroup = (itemName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(itemName)) {
        next.delete(itemName);
      } else {
        next.add(itemName);
      }
      return next;
    });
  };

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

  // Format display name
  const displayName = company.name && company.name !== 'Organisation Name' 
    ? company.name 
    : `Company ${company.id ? company.id.slice(-4) : 'Unknown'}`;

  return {
    // State
    company,
    loading,
    loadError,
    currentTier,
    insets,
    
    // UI state
    isItemsExpanded,
    isNewsExpanded,
    isProjectsExpanded,
    isContactExpanded,
    isCompanyInfoExpanded,
    isSummaryExpanded,
    expandedGroups,
    
    // Pagination
    currentPage,
    currentProjectPage,
    totalPages,
    totalProjectPages,
    currentGroups,
    currentProjects,
    groupedCapabilities,
    projectsData,
    
    // Data
    displayName,
    
    // Handlers
    handleBack,
    handleBookmark,
    handleShare,
    handleExport,
    handleICNChat,
    handleGatewayLink,
    handleICNContact,
    handleDirections,
    handleEmail,
    handleCall,
    handleWebsite,
    toggleGroup,
    handleNextPage,
    handlePrevPage,
    handleNextProjectPage,
    handlePrevProjectPage,
    
    // Setters
    setIsItemsExpanded,
    setIsNewsExpanded,
    setIsProjectsExpanded,
    setIsContactExpanded,
    setIsCompanyInfoExpanded,
    setIsSummaryExpanded,
    setCurrentPage,
    setCurrentProjectPage,
    
    // Context
    isBookmarked,
  };
};
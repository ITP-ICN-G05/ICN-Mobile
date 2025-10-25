import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SearchBar from '../../components/common/SearchBar';
import CompanyCard from '../../components/common/CompanyCard';
import EnhancedFilterModal, { EnhancedFilterOptions } from '../../components/common/EnhancedFilterModal';
import { Colors, Spacing } from '../../constants/colors';
import { Company } from '../../types';
import { useUserTier } from '../../contexts/UserTierContext';
import { useICNData } from '../../hooks/useICNData';
import { useBookmark } from '../../contexts/BookmarkContext';
import { useFilter } from '../../contexts/FilterContext';

// Extended local colors (adding to the imported Colors)
const LocalColors = {
  ...Colors,
  avatarBg: '#E0E0E0', // Gray avatar background
  headerBg: '#FFFFFF', // Statistics area background color changed to white
  searchBg: '#FFFFFF', // Search bar background color changed to white
  statNumber: '#F7B85C', // Warm light orange for statistics
};

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// State normalization mapping
const STATE_ALIASES: Record<string, string> = {
  VIC: 'VIC', Victoria: 'VIC',
  NSW: 'NSW', 'New South Wales': 'NSW',
  QLD: 'QLD', Queensland: 'QLD',
  SA: 'SA', 'South Australia': 'SA',
  WA: 'WA', 'Western Australia': 'WA',
  TAS: 'TAS', Tasmania: 'TAS',
  ACT: 'ACT', 'Australian Capital Territory': 'ACT',
  NT: 'NT', 'Northern Territory': 'NT',
  NI: 'NI', 'North Island': 'NI',
  SI: 'SI', 'South Island': 'SI'
};

// Helper function to normalize state codes
const normaliseState = (s?: string): string | undefined => {
  if (!s || s.trim() === '' || s.trim() === '#N/A') return undefined;
  const trimmed = s.trim();
  return STATE_ALIASES[trimmed] ?? trimmed.toUpperCase();
};

// Helper function to extract company sectors from multiple sources
const extractCompanySectors = (c: Company): string[] => {
  const list1 = Array.isArray((c as any).keySectors) ? (c as any).keySectors : [];
  const list2 = c.icnCapabilities?.map(x => (x as any).sector ?? (x as any).sectorName)?.filter(Boolean) ?? [];
  return Array.from(new Set([...list1, ...list2])).map(s => String(s).toLowerCase());
};

export default function CompaniesScreen() {
  // Navigation hook
  const navigation = useNavigation<any>();
  const { currentTier, features } = useUserTier();
  
  // Use Bookmark Context
  const { bookmarkedIds, toggleBookmark, isBookmarked } = useBookmark();
  
  // Use global filter context for synchronization with MapScreen
  const { filters, setFilters, clearFilters: clearGlobalFilters } = useFilter();
  
  // Use ICN Data Hook
  const {
    companies: allCompanies,
    searchResults: icnSearchResults,
    loading: icnLoading,
    error: icnError,
    statistics,
    filterOptions: icnFilterOptions,
    search: searchICN,
    applyFilters: applyICNFilters,
    refresh: refreshICN
  } = useICNData(true);
  
  // State management
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'verified' | 'recent'>('name');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backToTopAnim = useRef(new Animated.Value(0)).current;
  
  // Ref for FlatList
  const flatListRef = useRef<FlatList>(null);

  // Use ICN search when text changes
  useEffect(() => {
    if (searchText) {
      searchICN(searchText);
    } else {
      // Reset to all companies when search is cleared
      applyICNFilters({});
    }
  }, [searchText]);

  // Debug logging to verify company type derivation (temporary)
  useEffect(() => {
    if (allCompanies.length > 0) {
      console.log('=== Company Type Debug Info ===');
      const sampleCompanies = allCompanies.slice(0, 3);
      sampleCompanies.forEach((company, index) => {
        console.log(`Company ${index + 1}: ${company.name}`);
        console.log(`  - companyType: ${company.companyType || 'undefined'}`);
        console.log(`  - icnCapabilities:`, company.icnCapabilities?.map(c => c.capabilityType) || 'none');
        console.log('---');
      });
    }
  }, [allCompanies]);


  // Filter and sort companies
  const filteredAndSortedCompanies = useMemo(() => {
    // Start with search results or all companies
    let filtered = searchText ? icnSearchResults : allCompanies;

    // Apply capability filter (now checks itemName for items/services)
    if (filters.capabilities.length > 0) {
      filtered = filtered.filter(company =>
        filters.capabilities.some(capability =>
          company.icnCapabilities?.some(cap =>
            cap.itemName.toLowerCase().includes(capability.toLowerCase())
          )
        )
      );
    }

    // Apply sector filter - Fixed to support backend data structure
    if (filters.sectors && filters.sectors.length > 0) {
      const wantedSectors = filters.sectors
        .filter(s => s !== 'All')
        .map(s => s.toLowerCase());
      
      if (wantedSectors.length > 0) {
        filtered = filtered.filter(company => {
          const companySectors = extractCompanySectors(company);
          return wantedSectors.some(wanted => 
            companySectors.some(have => have.includes(wanted))
          );
        });
      }
    }

    // Apply state filter - Fixed with normalization
    if (filters.state && filters.state !== 'All') {
      const targetState = normaliseState(filters.state);
      if (targetState) {
        filtered = filtered.filter(company => 
          normaliseState(company.billingAddress?.state) === targetState
        );
      }
    }

    // Apply company type filter (simplified - direct match only)
    if (filters.companyTypes && filters.companyTypes.length > 0) {
      filtered = filtered.filter(company => {
        const capabilityTypes = company.icnCapabilities?.map(cap => cap.capabilityType) || [];
        // Direct match - no grouping logic needed
        return filters.companyTypes!.some(filterType =>
          capabilityTypes.includes(filterType as any)
        );
      });
    }

    // Apply distance filter (would need actual location logic)
    if (filters.distance !== 'All') {
      // In a real app, this would calculate actual distances
      // For now, just mock it
    }

    // Apply company size filter (Plus tier only)
    if (filters.companySize && filters.companySize !== 'All' && features.canFilterBySize) {
      filtered = filtered.filter(company => {
        switch(filters.companySize) {
          case 'SME (1-50)':
            return !company.employeeCount || company.employeeCount <= 50;
          case 'Medium (51-200)':
            return company.employeeCount && company.employeeCount > 50 && company.employeeCount <= 200;
          case 'Large (201-500)':
            return company.employeeCount && company.employeeCount > 200 && company.employeeCount <= 500;
          case 'Enterprise (500+)':
            return company.employeeCount && company.employeeCount > 500;
          default:
            return true;
        }
      });
    }

    // Apply certification filter (Plus tier only)
    if (filters.certifications?.length && features.canFilterByCertifications) {
      filtered = filtered.filter(company =>
        company.certifications?.some(cert => 
          filters.certifications?.includes(cert)
        )
      );
    }

    // Apply ownership type filter (Premium tier only)
    if (filters.ownershipType?.length && features.canFilterByDiversity) {
      filtered = filtered.filter(company =>
        company.ownershipType?.some(ownership =>
          filters.ownershipType?.includes(ownership)
        )
      );
    }

    // Apply social enterprise filter (Premium tier only)
    if (filters.socialEnterprise && features.canFilterByDiversity) {
      filtered = filtered.filter(company => company.socialEnterprise === true);
    }

    // Apply Australian Disability Enterprise filter (Premium tier only)
    if (filters.australianDisability && features.canFilterByDiversity) {
      filtered = filtered.filter(company => company.australianDisabilityEnterprise === true);
    }

    // Apply revenue filter (Premium tier only)
    if (filters.revenue && features.canFilterByRevenue) {
      const { min = 0, max = 10000000 } = filters.revenue;
      filtered = filtered.filter(company =>
        company.revenue !== undefined && 
        company.revenue >= min && 
        company.revenue <= max
      );
    }

    // Apply employee count filter (Premium tier only)
    if (filters.employeeCount && features.canFilterByRevenue) {
      const { min = 0, max = 1000 } = filters.employeeCount;
      filtered = filtered.filter(company =>
        company.employeeCount !== undefined && 
        company.employeeCount >= min && 
        company.employeeCount <= max
      );
    }

    // Apply local content percentage filter (Premium tier only)
    if (filters.localContentPercentage && filters.localContentPercentage > 0 && features.canFilterByRevenue) {
      const minLocalContent = filters.localContentPercentage;
      filtered = filtered.filter(company =>
        company.localContentPercentage !== undefined && 
        company.localContentPercentage >= minLocalContent
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => {
          // Handle placeholder names
          const nameA = a.name === 'Organisation Name' ? `Company ${a.id.slice(-4)}` : a.name;
          const nameB = b.name === 'Organisation Name' ? `Company ${b.id.slice(-4)}` : b.name;
          return nameA.localeCompare(nameB);
        });
        break;
      case 'verified':
        filtered.sort((a, b) => {
          if (a.verificationStatus === 'verified' && b.verificationStatus !== 'verified') return -1;
          if (a.verificationStatus !== 'verified' && b.verificationStatus === 'verified') return 1;
          return a.name.localeCompare(b.name);
        });
        break;
      case 'recent':
        // Sort by last updated or ID
        filtered.sort((a, b) => {
          if (a.lastUpdated && b.lastUpdated) {
            return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
          }
          return b.id.localeCompare(a.id);
        });
        break;
    }

    return filtered;
  }, [searchText, filters, sortBy, allCompanies, icnSearchResults, features]);

  // Compute UI statistics from displayed data
  const uiStats = useMemo(() => ({
    total: filteredAndSortedCompanies.length,
    verified: filteredAndSortedCompanies.filter(
      c => c.verificationStatus === 'verified'
    ).length,
    saved: bookmarkedIds.length,
  }), [filteredAndSortedCompanies, bookmarkedIds]);

  // Bookmarked companies section
  const bookmarkedCompanies = useMemo(() => {
    return allCompanies.filter(company => bookmarkedIds.includes(company.id));
  }, [bookmarkedIds, allCompanies]);

  // Check if filters are active
  const hasActiveFilters = () => {
    return filters.capabilities.length > 0 || 
           (filters.sectors && filters.sectors.length > 0) ||
           (filters.state && filters.state !== 'All') ||
           (filters.companyTypes && filters.companyTypes.length > 0) ||
           filters.distance !== 'All' ||
           (filters.companySize && filters.companySize !== 'All') ||
           (filters.certifications && filters.certifications.length > 0) ||
           (filters.ownershipType && filters.ownershipType.length > 0) ||
           filters.socialEnterprise ||
           filters.australianDisability ||
           (filters.revenue && (filters.revenue.min > 0 || filters.revenue.max < 10000000)) ||
           (filters.employeeCount && (filters.employeeCount.min > 0 || filters.employeeCount.max < 1000)) ||
           (filters.localContentPercentage && filters.localContentPercentage > 0);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.capabilities.length > 0) count++;
    if (filters.sectors && filters.sectors.length > 0) count++;
    if (filters.state && filters.state !== 'All') count++;
    if (filters.companyTypes && filters.companyTypes.length > 0) count++;
    if (filters.distance !== 'All') count++;
    if (filters.companySize && filters.companySize !== 'All') count++;
    if (filters.certifications && filters.certifications.length > 0) count++;
    if (filters.ownershipType && filters.ownershipType.length > 0) count++;
    if (filters.socialEnterprise) count++;
    if (filters.australianDisability) count++;
    if (filters.revenue && (filters.revenue.min > 0 || filters.revenue.max < 10000000)) count++;
    if (filters.employeeCount && (filters.employeeCount.min > 0 || filters.employeeCount.max < 1000)) count++;
    if (filters.localContentPercentage && filters.localContentPercentage > 0) count++;
    return count;
  };

  // Get filter badges for display
  const getFilterBadges = () => {
    const badges = [];
    
    if (filters.capabilities.length > 0) {
      badges.push(`${filters.capabilities.length} capabilities`);
    }
    if (filters.sectors && filters.sectors.length > 0) {
      badges.push(`${filters.sectors.length} sectors`);
    }
    if (filters.state && filters.state !== 'All') {
      badges.push(filters.state);
    }
    if (filters.companyTypes && filters.companyTypes.length > 0) {
      badges.push(`${filters.companyTypes.length} types`);
    }
    if (filters.companySize && filters.companySize !== 'All') {
      badges.push(filters.companySize);
    }
    if (filters.certifications && filters.certifications.length > 0) {
      badges.push('Certified');
    }
    if (filters.ownershipType && filters.ownershipType.length > 0) {
      badges.push('Diverse owned');
    }
    if (filters.socialEnterprise) {
      badges.push('Social enterprise');
    }
    if (filters.australianDisability) {
      badges.push('ADE');
    }
    if (filters.revenue) {
      const minM = (filters.revenue.min / 1000000).toFixed(1);
      const maxM = (filters.revenue.max / 1000000).toFixed(1);
      badges.push(`Revenue: $${minM}M-$${maxM}M`);
    }
    if (filters.employeeCount) {
      badges.push(`Employees: ${filters.employeeCount.min}-${filters.employeeCount.max}`);
    }
    if (filters.localContentPercentage && filters.localContentPercentage > 0) {
      badges.push(`Local content ≥${filters.localContentPercentage}%`);
    }
    
    return badges;
  };

  // Toggle bookmark - now uses BookmarkContext
  const handleToggleBookmark = async (id: string) => {
    // Check bookmark limit for free tier
    if (currentTier === 'free' && !isBookmarked(id) && bookmarkedIds.length >= 10) {
      Alert.alert(
        'Bookmark Limit',
        'Free tier allows up to 10 bookmarks. Upgrade to save more companies.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: handleNavigateToPayment }
        ]
      );
      return;
    }
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await toggleBookmark(id);
  };

  // Handle company press
  const handleCompanyPress = (company: Company) => {
    navigation.navigate('CompanyDetail', { company });
  };

  // Handle refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshICN();
    } finally {
      setRefreshing(false);
    }
  }, [refreshICN]);

  // Normalize filters to handle "All" values properly
  const normaliseFilters = (f: EnhancedFilterOptions): EnhancedFilterOptions => ({
    capabilities: f.capabilities || [],
    sectors: f.sectors?.filter(s => s !== 'All') ?? [],
    distance: f.distance || 'All',
    state: !f.state || f.state === 'All' ? undefined : f.state,
    companyTypes: f.companyTypes && f.companyTypes.length > 0 ? f.companyTypes : undefined,
    companySize: !f.companySize || f.companySize === 'All' ? undefined : f.companySize,
    certifications: f.certifications && f.certifications.length > 0 ? f.certifications : undefined,
    ownershipType: f.ownershipType && f.ownershipType.length > 0 ? f.ownershipType : undefined,
    socialEnterprise: f.socialEnterprise || undefined,
    australianDisability: f.australianDisability || undefined,
    revenue: f.revenue,
    employeeCount: f.employeeCount,
    localContentPercentage: f.localContentPercentage,
  });

  // Apply filters
  const handleApplyFilters = (newFilters: EnhancedFilterOptions) => {
    const normalized = normaliseFilters(newFilters);
    console.log('[CompaniesScreen] Applying filters:', normalized);
    setFilters(normalized);
    setFilterModalVisible(false);
    
    // Note: Filtering is done in the useMemo, not through ICN data service
  };

  // Clear filters
  const clearFilters = () => {
    clearGlobalFilters();
    applyICNFilters({});
  };

  // Toggle sort options
  const toggleSortOptions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowSortOptions(!showSortOptions);
  };

  // Handle scroll event to show/hide back to top button
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldShow = offsetY > 300; // Show after scrolling 300px
    
    if (shouldShow !== showBackToTop) {
      setShowBackToTop(shouldShow);
      Animated.timing(backToTopAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  // Scroll to top function
  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Navigate to payment
  const handleNavigateToPayment = () => {
    navigation.navigate('Payment');
  };

  // Create robust filter options for modal with fallback mechanism
  const modalFilterOptions = useMemo(() => {
    // Use backend options if present, otherwise build from data in memory
    const sectors = icnFilterOptions?.sectors?.length
      ? icnFilterOptions.sectors
      : Array.from(new Set(allCompanies.flatMap(c => extractCompanySectors(c)))).sort();

    const states = icnFilterOptions?.states?.length
      ? icnFilterOptions.states
      : Array.from(new Set(
          allCompanies
            .map(c => normaliseState(c.billingAddress?.state))
            .filter(Boolean) as string[]
        )).sort();

    const capabilities = icnFilterOptions?.capabilities?.length
      ? icnFilterOptions.capabilities
      : Array.from(new Set(
          allCompanies.flatMap(c => c.capabilities || [])
        )).sort();

    const capabilityTypes = icnFilterOptions?.capabilityTypes?.length
      ? icnFilterOptions.capabilityTypes
      : Array.from(new Set(
          allCompanies.flatMap(c => c.icnCapabilities?.map(ic => ic.capabilityType) || [])
        )).sort();

    const cities = icnFilterOptions?.cities?.length
      ? icnFilterOptions.cities
      : Array.from(new Set(
          allCompanies
            .map(c => c.billingAddress?.city)
            .filter((city): city is string => 
              Boolean(city && city !== 'City Not Available' && city !== '#N/A')
            )
        )).sort();

    const itemNames = icnFilterOptions?.itemNames?.length
      ? icnFilterOptions.itemNames
      : Array.from(new Set(
          allCompanies.flatMap(c => c.icnCapabilities?.map(ic => ic.itemName) || [])
        )).filter(name => name && name !== 'Unknown Item').sort();

    return { 
      ...(icnFilterOptions ?? {}), 
      sectors, 
      states, 
      capabilities, 
      capabilityTypes,
      cities,
      itemNames
    };
  }, [icnFilterOptions, allCompanies]);

  // Handle export
  const handleExport = () => {
    if (!features.canExportFull && features.exportLimit === 10) {
      Alert.alert(
        'Limited Export',
        `Free tier allows ${features.exportLimit} exports per month. Upgrade for unlimited exports.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: handleNavigateToPayment }
        ]
      );
    } else {
      Alert.alert('Export', `Exporting ${filteredAndSortedCompanies.length} companies...`);
    }
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Tier Indicator */}
      <View style={styles.tierBar}>
        <View style={[styles.tierBadge, { backgroundColor: getTierColor() }]}>
          <Ionicons name={getTierIcon()} size={16} color={Colors.white} />
          <Text style={styles.tierBarText}>
            {currentTier.toUpperCase()} TIER
          </Text>
        </View>
        {currentTier !== 'premium' && (
          <TouchableOpacity onPress={handleNavigateToPayment}>
            <Text style={styles.upgradeLink}>Upgrade →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Bar with UI Statistics */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{uiStats.total}</Text>
          <Text style={styles.statLabel}>Companies</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{uiStats.verified}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{uiStats.saved}</Text>
          <Text style={styles.statLabel}>
            Saved {currentTier === 'free' && '(10 max)'}
          </Text>
        </View>
      </View>

      {/* Sort and View Options */}
      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.sortButton} onPress={toggleSortOptions}>
          <Ionicons name="swap-vertical" size={18} color={Colors.text} />
          <Text style={styles.sortButtonText}>
            Sort: {sortBy === 'name' ? 'Name' : sortBy === 'verified' ? 'Verified' : 'Recent'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.viewToggle} 
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
        >
          <Ionicons 
            name={viewMode === 'list' ? 'grid' : 'list'} 
            size={20} 
            color={Colors.black50} 
          />
        </TouchableOpacity>
      </View>

      {/* Sort Options Dropdown */}
      {showSortOptions && (
        <View style={styles.sortOptions}>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'name' && styles.sortOptionActive]}
            onPress={() => { setSortBy('name'); setShowSortOptions(false); }}
          >
            <Text style={[styles.sortOptionText, sortBy === 'name' && styles.sortOptionTextActive]}>
              By Name (A-Z)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'verified' && styles.sortOptionActive]}
            onPress={() => { setSortBy('verified'); setShowSortOptions(false); }}
          >
            <Text style={[styles.sortOptionText, sortBy === 'verified' && styles.sortOptionTextActive]}>
              Verified First
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'recent' && styles.sortOptionActive]}
            onPress={() => { setSortBy('recent'); setShowSortOptions(false); }}
          >
            <Text style={[styles.sortOptionText, sortBy === 'recent' && styles.sortOptionTextActive]}>
              Most Recent
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Filters Bar */}
      {hasActiveFilters() && (
        <View style={styles.activeFiltersBar}>
          <View style={styles.activeFiltersInfo}>
            <Text style={styles.activeFiltersText}>
              {getActiveFilterCount()} filter{getActiveFilterCount() > 1 ? 's' : ''} active
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.filterBadgesScroll}
            >
              {getFilterBadges().map((badge, index) => (
                <View key={index} style={styles.filterChip}>
                  <Text style={styles.filterChipText}>{badge}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bookmarked Section */}
      {bookmarkedCompanies.length > 0 && (
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
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.bookmarkedCard}
                onPress={() => handleCompanyPress(item)}
              >
                <View style={styles.bookmarkedAvatar}>
                  <Text style={styles.bookmarkedAvatarText}>
                    {(item.name === 'Organisation Name' ? `C${item.id.slice(-2)}` : item.name.charAt(0)).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.bookmarkedName} numberOfLines={1}>
                  {item.name === 'Organisation Name' ? `Company ${item.id.slice(-4)}` : item.name}
                </Text>
                {item.verificationStatus === 'verified' && (
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.bookmarkedList}
          />
        </View>
      )}
    </View>
  );

  // Get tier color
  const getTierColor = () => {
    switch(currentTier) {
      case 'premium': return Colors.warning;
      case 'plus': return Colors.primary;
      default: return Colors.black50;
    }
  };

  // Get tier icon
  const getTierIcon = () => {
    switch(currentTier) {
      case 'premium': return 'star';
      case 'plus': return 'star-half';
      default: return 'star-outline';
    }
  };

  // Format city and state, filtering out #N/A values
  const formatCityState = (company: Company) => {
    const city = company.billingAddress?.city;
    const state = company.billingAddress?.state;
    const cleanValue = (s?: string) => 
      s && s !== '#N/A' && s.trim() !== '' ? s : null;
    const parts = [cleanValue(city), cleanValue(state)].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Location unavailable';
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business-outline" size={64} color={Colors.black50} />
      <Text style={styles.emptyStateTitle}>No Companies Found</Text>
      <Text style={styles.emptyStateText}>
        {searchText ? 
          `No results for "${searchText}"` : 
          'Try adjusting your filters'}
      </Text>
      {hasActiveFilters() && (
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render grid item (alternative view)
  const renderGridItem = ({ item }: { item: Company }) => {
    const displayName = item.name === 'Organisation Name' ? `Company ${item.id.slice(-4)}` : item.name;
    
    return (
      <TouchableOpacity 
        style={styles.gridCard}
        onPress={() => handleCompanyPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.gridAvatar}>
          <Text style={styles.gridAvatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.gridName} numberOfLines={2}>{displayName}</Text>
        <Text style={styles.gridAddress} numberOfLines={1}>
          {formatCityState(item)}
        </Text>
        <TouchableOpacity 
          style={styles.gridBookmark}
          onPress={() => handleToggleBookmark(item.id)}
        >
          <Ionicons 
            name={isBookmarked(item.id) ? 'bookmark' : 'bookmark-outline'} 
            size={16} 
            color={Colors.black50}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render loading state
  if (icnLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading ICN Navigator data...</Text>
      </View>
    );
  }

  // Render error state
  if (icnError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
        <Text style={styles.errorTitle}>Error Loading Data</Text>
        <Text style={styles.errorText}>{icnError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refreshICN()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search companies, capabilities, locations..."
        onFilter={() => setFilterModalVisible(true)}
      />
      
      <FlatList
        ref={flatListRef}
        data={filteredAndSortedCompanies}
        keyExtractor={(item) => item.id}
        renderItem={viewMode === 'list' ? 
          ({ item }) => (
            <CompanyCard
              company={item}
              onPress={() => handleCompanyPress(item)}
              onBookmark={() => handleToggleBookmark(item.id)}
              isBookmarked={isBookmarked(item.id)}
            />
          ) : 
          renderGridItem
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          filteredAndSortedCompanies.length === 0 && styles.emptyListContent
        ]}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when changing columns
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />
      
      <EnhancedFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
        onNavigateToPayment={handleNavigateToPayment}
        filterOptions={modalFilterOptions} // Pass robust filter options with fallback
      />

      {/* Back to Top Button */}
      {showBackToTop && (
        <Animated.View
          style={[
            styles.backToTopButton,
            {
              opacity: backToTopAnim,
              transform: [
                {
                  translateY: backToTopAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backToTopTouchable}
            onPress={scrollToTop}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={24} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// Keep all existing styles exactly as they are
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.black50,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.black50,
    textAlign: 'center',
    marginHorizontal: 40,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  // ... (rest of the styles remain exactly the same)
  listContent: {
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: LocalColors.headerBg,
    marginBottom: 8,
  },
  tierBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.orange[400],
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tierBarText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  upgradeLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LocalColors.statNumber,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.black50,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.black20,
    marginVertical: 8,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportButton: {
    padding: 4,
  },
  viewToggle: {
    padding: 4,
  },
  sortOptions: {
    backgroundColor: LocalColors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  sortOptionActive: {
    backgroundColor: Colors.orange[400],
  },
  sortOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  sortOptionTextActive: {
    fontWeight: '600',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.orange[400],
  },
  activeFiltersInfo: {
    flex: 1,
    marginRight: 8,
  },
  activeFiltersText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  filterBadgesScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.text,
  },
  clearFiltersText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  bookmarkedSection: {
    paddingVertical: 12,
    backgroundColor: LocalColors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionCount: {
    fontSize: 14,
    color: Colors.black50,
  },
  bookmarkedList: {
    paddingHorizontal: 16,
  },
  bookmarkedCard: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: Colors.black20,
  },
  bookmarkedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LocalColors.avatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookmarkedAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  bookmarkedName: {
    fontSize: 12,
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.black50,
    textAlign: 'center',
    marginBottom: 24,
  },
  clearButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  clearButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    margin: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LocalColors.avatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
    height: 34,
  },
  gridAddress: {
    fontSize: 11,
    color: Colors.black50,
    textAlign: 'center',
    marginBottom: 8,
  },
  gridBookmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  backToTopButton: {
    position: 'absolute',
    right: 16,
    bottom: 90,  // Above bottom navigation bar (nav bar is ~60-80px tall)
    zIndex: 999,
  },
  backToTopTouchable: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
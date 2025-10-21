import { useState, useEffect, useMemo } from 'react';
import { Alert, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Company } from '../../../../types';
import { EnhancedFilterOptions } from '../../../../components/common/EnhancedFilterModal';
import { useUserTier } from '../../../../contexts/UserTierContext';
import { useICNData } from '../../../../hooks/useICNData';
import { useFilterLogic } from './useFilterLogic';
import { useSortLogic } from './useSortLogic';
import { normaliseFilters, hasActiveFilters, getActiveFilterCount, getFilterBadges, extractCompanySectors, normaliseState } from '../utils/filterHelpers';
import { CompaniesScreenState, UIStats, FilterOptions } from '../types';
import { Colors } from '@/constants/colors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const useCompanies = () => {
  const navigation = useNavigation<any>();
  const { currentTier, features } = useUserTier();
  
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
  const [state, setState] = useState<CompaniesScreenState>({
    searchText: '',
    bookmarkedIds: [],
    refreshing: false,
    filterModalVisible: false,
    viewMode: 'list',
    sortBy: 'name',
    showSortOptions: false,
    filters: {
      capabilities: [],
      sectors: [],
      distance: 'All',
    }
  });

  // Use ICN search when text changes
  useEffect(() => {
    if (state.searchText) {
      searchICN(state.searchText);
    } else {
      applyICNFilters({});
    }
  }, [state.searchText]);

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

  // Filter companies
  const filteredCompanies = useFilterLogic({
    companies: allCompanies,
    searchResults: icnSearchResults,
    searchText: state.searchText,
    filters: state.filters,
    features
  });

  // Sort companies
  const filteredAndSortedCompanies = useSortLogic(filteredCompanies, state.sortBy);

  // Compute UI statistics from displayed data
  const uiStats: UIStats = useMemo(() => ({
    total: filteredAndSortedCompanies.length,
    verified: filteredAndSortedCompanies.filter(
      c => c.verificationStatus === 'verified'
    ).length,
    saved: state.bookmarkedIds.length,
  }), [filteredAndSortedCompanies, state.bookmarkedIds]);

  // Bookmarked companies section
  const bookmarkedCompanies = useMemo(() => {
    return allCompanies.filter(company => state.bookmarkedIds.includes(company.id));
  }, [state.bookmarkedIds, allCompanies]);

  // State setters
  const setSearchText = (text: string) => setState(prev => ({ ...prev, searchText: text }));
  const setFilterModalVisible = (visible: boolean) => setState(prev => ({ ...prev, filterModalVisible: visible }));
  const setViewMode = (mode: 'list' | 'grid') => setState(prev => ({ ...prev, viewMode: mode }));
  const setSortBy = (sort: 'name' | 'verified' | 'recent') => setState(prev => ({ ...prev, sortBy: sort }));
  const setShowSortOptions = (show: boolean) => setState(prev => ({ ...prev, showSortOptions: show }));

  // Toggle bookmark
  const toggleBookmark = (id: string) => {
    // Check bookmark limit for free tier
    if (currentTier === 'free' && !state.bookmarkedIds.includes(id) && state.bookmarkedIds.length >= 10) {
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
    setState(prev => ({
      ...prev,
      bookmarkedIds: prev.bookmarkedIds.includes(id) 
        ? prev.bookmarkedIds.filter(bookId => bookId !== id)
        : [...prev.bookmarkedIds, id]
    }));
  };

  // Handle company press
  const handleCompanyPress = (company: Company) => {
    navigation.navigate('CompanyDetail', { company });
  };

  // Handle refresh
  const onRefresh = async () => {
    setState(prev => ({ ...prev, refreshing: true }));
    try {
      await refreshICN();
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  };

  // Apply filters
  const handleApplyFilters = (newFilters: EnhancedFilterOptions) => {
    setState(prev => ({ 
      ...prev, 
      filters: normaliseFilters(newFilters),
      filterModalVisible: false
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setState(prev => ({ 
      ...prev, 
      filters: {
        capabilities: [],
        sectors: [],
        distance: 'All',
      }
    }));
    applyICNFilters({});
  };

  // Toggle sort options
  const toggleSortOptions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setState(prev => ({ ...prev, showSortOptions: !prev.showSortOptions }));
  };

  // Navigate to payment
  const handleNavigateToPayment = () => {
    navigation.navigate('Payment');
  };

  // Create robust filter options for modal with fallback mechanism
  const modalFilterOptions: FilterOptions = useMemo(() => {
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

    return { 
      ...(icnFilterOptions ?? {}), 
      sectors, 
      states, 
      capabilities, 
      capabilityTypes,
      cities
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

  return {
    // State
    ...state,
    allCompanies,
    icnLoading,
    icnError,
    filteredAndSortedCompanies,
    bookmarkedCompanies,
    uiStats,
    currentTier,
    features,
    modalFilterOptions,
    
    // Actions
    setSearchText,
    setFilterModalVisible,
    setViewMode,
    setSortBy,
    setShowSortOptions,
    toggleBookmark,
    handleCompanyPress,
    onRefresh,
    handleApplyFilters,
    clearFilters,
    toggleSortOptions,
    handleNavigateToPayment,
    handleExport,
    
    // Helpers
    hasActiveFilters: hasActiveFilters(state.filters),
    getActiveFilterCount: () => getActiveFilterCount(state.filters),
    getFilterBadges: () => getFilterBadges(state.filters),
    getTierColor,
    getTierIcon
  };
};
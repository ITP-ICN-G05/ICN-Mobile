import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, Animated, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SearchBarWithDropdown from '../../components/common/SearchBarWithDropdown';
import EnhancedFilterModal, { EnhancedFilterOptions } from '../../components/common/EnhancedFilterModal';
import { Colors, Spacing } from '../../constants/colors';
import { Company } from '../../types';
import { useUserTier } from '../../contexts/UserTierContext';
import icnDataService from '../../services/icnDataService';

const MELBOURNE_REGION: Region = {
  latitude: -37.8136,
  longitude: 144.9631,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  // Navigation hook
  const navigation = useNavigation<any>();
  const { currentTier, features } = useUserTier();
  
  // Safe area insets for different devices
  const insets = useSafeAreaInsets();
  
  const mapRef = useRef<MapView>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const slideAnimation = useRef(new Animated.Value(300)).current;
  const [region, setRegion] = useState<Region>(MELBOURNE_REGION);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isFromDropdownSelection, setIsFromDropdownSelection] = useState(false);
  
  // ICN Data state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<{
    sectors: string[];
    states: string[];
    cities: string[];
    capabilities: string[];
  }>({ sectors: [], states: [], cities: [], capabilities: [] });
  
  // Update filter state to use EnhancedFilterOptions
  const [filters, setFilters] = useState<EnhancedFilterOptions>({
    capabilities: [],
    sectors: [],
    distance: 'All',
  });

  // Load ICN data on mount
  useEffect(() => {
    loadICNData();
  }, []);

  const loadICNData = async () => {
    try {
      setIsLoading(true);
      await icnDataService.loadData();
      const loadedCompanies = icnDataService.getCompanies();
      const options = icnDataService.getFilterOptions();
      
      setCompanies(loadedCompanies);
      setFilterOptions(options);
      
      console.log(`Loaded ${loadedCompanies.length} companies from ICN`);
      
      // Zoom to show all companies initially
      if (loadedCompanies.length > 0) {
        setTimeout(() => {
          zoomToAllCompanies(loadedCompanies);
        }, 500);
      }
    } catch (error) {
      console.error('Error loading ICN data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const zoomToAllCompanies = (companiesArray: Company[]) => {
    if (companiesArray.length === 0) return;

    const lats = companiesArray.map(c => c.latitude);
    const lons = companiesArray.map(c => c.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    mapRef.current?.animateToRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5,
      longitudeDelta: (maxLon - minLon) * 1.5,
    }, 500);
  };

  // Filter companies based on search text and filters
  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    // Apply search text filter
    if (searchText) {
      filtered = icnDataService.searchCompanies(searchText);
    }

    // Apply capability filter (multi-select)
    if (filters.capabilities.length > 0) {
      filtered = filtered.filter(company =>
        filters.capabilities.some(capability => 
          company.capabilities?.includes(capability) ||
          company.icnCapabilities?.some(cap => 
            cap.itemName.toLowerCase().includes(capability.toLowerCase()) ||
            cap.detailedItemName.toLowerCase().includes(capability.toLowerCase())
          )
        )
      );
    }

    // Apply sector filter
    if (filters.sectors && filters.sectors.length > 0) {
      filtered = filtered.filter(company =>
        filters.sectors.some(sector =>
          company.keySectors.some(keySector =>
            keySector.toLowerCase().includes(sector.toLowerCase())
          )
        )
      );
    }

    // Apply state filter
    if (filters.state && filters.state !== 'All') {
      filtered = filtered.filter(company =>
        company.billingAddress?.state === filters.state
      );
    }

    // Apply company type filter
    if (filters.companyTypes && filters.companyTypes.length > 0) {
      filtered = filtered.filter(company => {
        const hasSupplier = company.icnCapabilities?.some(cap => cap.capabilityType === 'Supplier');
        const hasManufacturer = company.icnCapabilities?.some(cap => cap.capabilityType === 'Manufacturer');
        
        return filters.companyTypes?.some(type => {
          if (type === 'Supplier' && hasSupplier) return true;
          if (type === 'Manufacturer' && hasManufacturer) return true;
          if (type === 'Both' && hasSupplier && hasManufacturer) return true;
          return false;
        });
      });
    }

    // Apply distance filter (single-select)
    if (filters.distance !== 'All' && region) {
      let maxDistance = 50; // default max
      
      // Parse distance string
      if (filters.distance.includes('500m')) {
        maxDistance = 0.5;
      } else if (filters.distance.includes('km')) {
        maxDistance = parseInt(filters.distance);
      }
      
      const kmToDegrees = maxDistance / 111; // Rough conversion
      
      filtered = filtered.filter(company => {
        const latDiff = Math.abs(company.latitude - region.latitude);
        const lonDiff = Math.abs(company.longitude - region.longitude);
        const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
        return distance <= kmToDegrees;
      });
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
      filtered = filtered.filter(company =>
        company.localContentPercentage !== undefined && 
        company.localContentPercentage >= filters.localContentPercentage!
      );
    }

    return filtered;
  }, [searchText, filters, region, features, companies]);

  const hasActiveFilters = () => {
    return filters.capabilities.length > 0 || 
           (filters.sectors && filters.sectors.length > 0) ||
           filters.distance !== 'All' ||
           (filters.state && filters.state !== 'All') ||
           (filters.companyTypes && filters.companyTypes.length > 0) ||
           (filters.companySize && filters.companySize !== 'All') ||
           (filters.certifications && filters.certifications.length > 0) ||
           (filters.ownershipType && filters.ownershipType.length > 0) ||
           filters.socialEnterprise ||
           filters.australianDisability ||
           (filters.revenue && (filters.revenue.min > 0 || filters.revenue.max < 10000000)) ||
           (filters.employeeCount && (filters.employeeCount.min > 0 || filters.employeeCount.max < 1000)) ||
           (filters.localContentPercentage && filters.localContentPercentage > 0);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.capabilities.length > 0) count++;
    if (filters.sectors && filters.sectors.length > 0) count++;
    if (filters.distance !== 'All') count++;
    if (filters.state && filters.state !== 'All') count++;
    if (filters.companyTypes && filters.companyTypes.length > 0) count++;
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

  const zoomToFilteredResults = () => {
    if (filteredCompanies.length === 0) return;

    if (filteredCompanies.length === 1) {
      mapRef.current?.animateToRegion({
        latitude: filteredCompanies[0].latitude,
        longitude: filteredCompanies[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    } else {
      const lats = filteredCompanies.map(c => c.latitude);
      const lons = filteredCompanies.map(c => c.longitude);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      
      mapRef.current?.animateToRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLon + maxLon) / 2,
        latitudeDelta: (maxLat - minLat) * 1.5,
        longitudeDelta: (maxLon - minLon) * 1.5,
      }, 500);
    }
  };

  const handleMarkerPress = (company: Company) => {
    setSelectedCompany(company);
    setIsFromDropdownSelection(false);
    
    // Start slide-in animation from bottom
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    mapRef.current?.animateToRegion({
      latitude: company.latitude,
      longitude: company.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  };

  // Navigate to company detail
  const navigateToDetail = (company: Company) => {
    console.log('Navigating to detail for:', company.name);
    navigation.navigate('CompanyDetail', { company });
  };

  // Handle callout press
  const handleCalloutPress = (company: Company) => {
    console.log('Callout pressed for:', company.name);
    navigateToDetail(company);
  };

  // Handler for company selection from dropdown
  const handleCompanySelection = (company: Company) => {
    // Show the selected org name in the search bar
    setSearchText(company.name);
    // Mirror pin-tap behavior: center map + open card
    handleMarkerPress(company);
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleApplyFilters = (newFilters: EnhancedFilterOptions) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setIsFromDropdownSelection(false);
  };

  const getMarkerColor = (company: Company) => {
    if (searchText && company.name.toLowerCase().includes(searchText.toLowerCase())) {
      return Colors.warning;
    }
    return company.verificationStatus === 'verified' ? Colors.success : Colors.primary;
  };

  const clearFilters = () => {
    setIsFromDropdownSelection(false);
    setFilters({
      capabilities: [],
      sectors: [],
      distance: 'All',
    });
    mapRef.current?.animateToRegion(MELBOURNE_REGION, 500);
  };

  const handleNavigateToPayment = () => {
    navigation.navigate('Payment');
  };

  // Determine if filter bar should be shown
  const shouldShowFilterBar = hasActiveFilters() && !isFromDropdownSelection;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading ICN Companies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map as background layer */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={MELBOURNE_REGION}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {filteredCompanies.map((company) => (
          <Marker
            key={company.id}
            coordinate={{
              latitude: company.latitude,
              longitude: company.longitude,
            }}
            onPress={() => {
              console.log('Marker pressed:', company.name);
              handleMarkerPress(company);
            }}
            onCalloutPress={() => {
              console.log('Callout pressed:', company.name);
              handleCalloutPress(company);
            }}
            pinColor={getMarkerColor(company)}
            tracksViewChanges={false}
          >
            <Callout 
              style={styles.callout}
              onPress={() => {
                console.log('Callout onPress:', company.name);
                navigateToDetail(company);
              }}
              tooltip={false}
            >
              <View style={styles.calloutContent}>
                <Text style={styles.calloutTitle} numberOfLines={1}>
                  {company.name}
                </Text>
                <Text style={styles.calloutAddress} numberOfLines={2}>
                  {company.address}
                </Text>
                <View style={styles.calloutSectors}>
                  {company.keySectors.slice(0, 3).map((sector, index) => (
                    <Text key={index} style={styles.calloutSector}>{sector}</Text>
                  ))}
                </View>
                {company.verificationStatus === 'verified' && (
                  <View style={styles.verifiedIndicator}>
                    <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
                <View style={styles.calloutButton}>
                  <View style={styles.calloutButtonInner}>
                    <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
                    <Text style={styles.calloutButtonText}>Tap to View Details</Text>
                  </View>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Search bar overlay */}
      <View style={[styles.searchOverlay, { top: insets.top + 10 }]}>
        <SearchBarWithDropdown
          value={searchText}
          onChangeText={handleSearchChange}
          onSelectCompany={handleCompanySelection}
          onFilter={undefined}
          companies={companies}
          placeholder="Search companies, locations..."
        />
      </View>
      
      {/* Filter indicator bar */}
      {shouldShowFilterBar && (
        <View style={[styles.filterBar, { top: insets.top + 80 }]}>
          <View style={styles.filterInfo}>
            <Text style={styles.filterText}>
              {filteredCompanies.length} of {companies.length} companies
            </Text>
            {getActiveFilterCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {getActiveFilterCount()} filters
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* No results overlay */}
      {filteredCompanies.length === 0 && !isLoading && (
        <View style={styles.noResultsOverlay}>
          <Ionicons name="search" size={48} color={Colors.black50} />
          <Text style={styles.noResultsText}>No companies found</Text>
          <Text style={styles.noResultsSubText}>Try adjusting your filters</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logo watermark */}
      <View style={[styles.logoWatermark, { bottom: insets.bottom + 100 }]}>
        <Image 
          source={require('../../../assets/ICN Logo Source/ICN-logo-full2.png')} 
          style={styles.watermarkLogo}
          resizeMode="contain"
        />
      </View>

      {/* Right side buttons */}
      <View style={[
        styles.rightButtonsContainer,
        selectedCompany && styles.rightButtonsWithCompanyDetail
      ]}>
        {/* Filter button */}
        <TouchableOpacity
          style={styles.filterFloatingButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={24} color={Colors.primary} />
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterBadgeFloat}>
              <Text style={styles.filterBadgeFloatText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Location button */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={() => {
            mapRef.current?.animateToRegion(MELBOURNE_REGION, 500);
          }}
        >
          <Ionicons name="locate" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Company detail panel */}
      {selectedCompany && (
        <Animated.View 
          style={[
            styles.companyDetail,
            {
              transform: [{ translateY: slideAnimation }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              Animated.timing(slideAnimation, {
                toValue: 300,
                duration: 250,
                useNativeDriver: true,
              }).start(() => {
                setSelectedCompany(null);
              });
            }}
          >
            <Ionicons name="close" size={24} color={Colors.black50} />
          </TouchableOpacity>
          <Text style={styles.detailName}>{selectedCompany.name}</Text>
          <Text style={styles.detailAddress}>{selectedCompany.address}</Text>
          <View style={styles.sectorContainer}>
            {selectedCompany.keySectors.slice(0, 4).map((sector, index) => (
              <View key={index} style={styles.sectorChip}>
                <Text style={styles.sectorText}>{sector}</Text>
              </View>
            ))}
          </View>
          {selectedCompany.verificationStatus === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.verifiedText}>Verified Company</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => navigateToDetail(selectedCompany)}
          >
            <Text style={styles.viewDetailsButtonText}>View Full Details</Text>
            <Ionicons name="arrow-forward" size={20} color="#D67635" />
          </TouchableOpacity>
        </Animated.View>
      )}
      
      <EnhancedFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
        onNavigateToPayment={handleNavigateToPayment}
        filterOptions={filterOptions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  filterBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    fontSize: 14,
    color: Colors.text,
  },
  filterBadge: {
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeText: {
    fontSize: 12,
    color: Colors.text,
  },
  clearText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  noResultsOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  noResultsSubText: {
    fontSize: 14,
    color: Colors.black50,
    marginTop: 8,
  },
  clearButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  clearButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  callout: {
    width: 220,
  },
  calloutContent: {
    padding: 10,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: Colors.black50,
    marginBottom: 8,
  },
  calloutSectors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  calloutSector: {
    fontSize: 10,
    color: Colors.primary,
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 10,
    color: Colors.success,
    marginLeft: 4,
  },
  calloutButton: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.black20,
    alignItems: 'center',
  },
  calloutButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  calloutButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  rightButtonsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    flexDirection: 'column',
    gap: 16,
    zIndex: 1001,
  },
  rightButtonsWithCompanyDetail: {
    bottom: 330,
  },
  filterFloatingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  filterBadgeFloat: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF8059',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  filterBadgeFloatText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  myLocationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  companyDetail: {
    position: 'absolute',
    bottom: 65,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  detailName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  detailAddress: {
    fontSize: 14,
    color: Colors.black50,
    marginBottom: 12,
  },
  sectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sectorChip: {
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sectorText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5DAB2',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    marginTop: 16,
    shadowColor: '#EF8059',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  viewDetailsButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#D67635',
    letterSpacing: 0.5,
  },
  logoWatermark: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
    opacity: 0.8,
  },
  watermarkLogo: {
    width: 90,
    height: 36,
  },
});
import React, { useState, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SearchBarWithDropdown from '../../components/common/SearchBarWithDropdown';
import FilterModal, { FilterOptions } from '../../components/common/FilterModal';
import { Colors, Spacing } from '../../constants/colors';
import { Company } from '../../types';
import { mockCompanies } from '../../data/mockCompanies';

const MELBOURNE_REGION: Region = {
  latitude: -37.8136,
  longitude: 144.9631,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen() {
  // Navigation hook
  const navigation = useNavigation<any>();
  
  const mapRef = useRef<MapView>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const slideAnimation = useRef(new Animated.Value(300)).current; // Animation value for slide-in effect
  const [region, setRegion] = useState<Region>(MELBOURNE_REGION);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isFromDropdownSelection, setIsFromDropdownSelection] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    capabilities: [],
    distance: 'All',
    verificationStatus: 'All',
  });

  // Filter companies based on search text and filters
  const filteredCompanies = useMemo(() => {
    let filtered = [...mockCompanies];

    // Apply search text filter
    if (searchText) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchText.toLowerCase()) ||
        company.address.toLowerCase().includes(searchText.toLowerCase()) ||
        company.keySectors.some(sector => 
          sector.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    // Apply capability filter (multi-select)
    if (filters.capabilities.length > 0) {
      filtered = filtered.filter(company =>
        filters.capabilities.some(capability => 
          company.keySectors.includes(capability) ||
          company.keySectors.some(sector => 
            sector.toLowerCase().includes(capability.toLowerCase())
          )
        )
      );
    }

    // Apply verification filter (single-select)
    if (filters.verificationStatus !== 'All') {
      const statusToCheck = filters.verificationStatus.toLowerCase();
      filtered = filtered.filter(company =>
        company.verificationStatus === statusToCheck
      );
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

    return filtered;
  }, [searchText, filters, region]);

  const hasActiveFilters = () => {
    return filters.capabilities.length > 0 || 
         filters.distance !== 'All' || 
         filters.verificationStatus !== 'All';
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.capabilities.length > 0) count++;
    if (filters.distance !== 'All') count++;
    if (filters.verificationStatus !== 'All') count++;
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
    console.log('Navigating to detail for:', company.name); // Debug log
    navigation.navigate('CompanyDetail', { company });
  };

  // Handle callout press (alternative approach)
  const handleCalloutPress = (company: Company) => {
    console.log('Callout pressed for:', company.name); // Debug log
    navigateToDetail(company);
  };

  // Handler for company selection from dropdown
  const handleCompanySelection = (company: Company) => {
    // Set flag to hide filter bar
    setIsFromDropdownSelection(true);
    
    // Zoom to selected company with closer view
    mapRef.current?.animateToRegion({
      latitude: company.latitude,
      longitude: company.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 500);
    
    // Show company details
    setSelectedCompany(company);
    
    // Clear search text after short delay
    setTimeout(() => {
      setSearchText('');
      setIsFromDropdownSelection(false);
    }, 1500);
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
    setTimeout(zoomToFilteredResults, 300);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setIsFromDropdownSelection(false);

    if (text === '' || text.length > 2) {
      setTimeout(zoomToFilteredResults, 500);
    }
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
      distance: 'All',
      verificationStatus: 'All',
    });
    mapRef.current?.animateToRegion(MELBOURNE_REGION, 500);
  };

  // Determine if filter bar should be shown
  const shouldShowFilterBar = hasActiveFilters() && !isFromDropdownSelection;

  return (
    <View style={styles.container}>
      {/* Map as background layer, fills entire screen */}
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
              console.log('Marker pressed:', company.name); // Debug log
              handleMarkerPress(company);
            }}
            onCalloutPress={() => {
              console.log('Callout pressed:', company.name); // Debug log
              handleCalloutPress(company);
            }}
            pinColor={getMarkerColor(company)}
            tracksViewChanges={false}
          >
            <Callout 
              style={styles.callout}
              onPress={() => {
                console.log('Callout onPress:', company.name); // Alternative method
                navigateToDetail(company);
              }}
              tooltip={false}
            >
              <View style={styles.calloutContent}>
                <Text style={styles.calloutTitle}>{company.name}</Text>
                <Text style={styles.calloutAddress}>{company.address}</Text>
                <View style={styles.calloutSectors}>
                  {company.keySectors.map((sector, index) => (
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

      {/* Search bar - floating overlay above map */}
      <View style={styles.searchOverlay}>
        <SearchBarWithDropdown
          value={searchText}
          onChangeText={handleSearchChange}
          onSelectCompany={handleCompanySelection}
          onFilter={undefined} // Remove filter function, handled separately
          companies={mockCompanies}
          placeholder="Search companies, locations..."
        />
      </View>
      
      {/* Filter indicator bar - positioned lower and hidden during dropdown selection */}
      {shouldShowFilterBar && (
        <View style={styles.filterBar}>
          <View style={styles.filterInfo}>
            <Text style={styles.filterText}>
              {filteredCompanies.length} companies
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
      {filteredCompanies.length === 0 && (
        <View style={styles.noResultsOverlay}>
          <Ionicons name="search" size={48} color={Colors.black50} />
          <Text style={styles.noResultsText}>No companies found</Text>
          <Text style={styles.noResultsSubText}>Try adjusting your filters</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}


      {/* Right side button container - includes filter and location buttons */}
      <View style={[
        styles.rightButtonsContainer,
        selectedCompany && styles.rightButtonsWithCompanyDetail // Move container up when company detail is shown
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

      {selectedCompany && (
        <Animated.View 
          style={[
            styles.companyDetail,
            {
              transform: [{ translateY: slideAnimation }] // Apply slide animation transform
            }
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              // Start slide-out animation when closing
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
            {selectedCompany.keySectors.map((sector, index) => (
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
      
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject, // Map fills entire screen as background layer
  },
  searchOverlay: {
    position: 'absolute', // Search bar as absolute positioned overlay
    top: 25, // Maintain 25px distance from screen top
    left: 0,
    right: 0,
    zIndex: 1000, // Ensure above map layer
  },
  filterBar: {
    position: 'absolute',
    top: 100,
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
    bottom: 120, // Base position of container
    flexDirection: 'column', // Vertical layout
    gap: 16, // Spacing between buttons
    zIndex: 1001, // Ensure container is on top layer
  },
  rightButtonsWithCompanyDetail: {
    bottom: 330, // Move entire container up when company detail is active
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
  filterButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadgeFloat: {
    position: 'absolute', // Absolute position at button top-right corner
    top: -6,
    right: -6,
    backgroundColor: '#EF8059', // Orange background
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, // White border
    borderColor: Colors.white,
  },
  filterBadgeFloatText: {
    color: Colors.white, // White text color
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
    bottom: 65, // Adjust this value to control upward movement distance
    left: 0, // Align to screen left edge
    right: 0, // Align to screen right edge
    backgroundColor: Colors.white,
    padding: 20,
    borderTopLeftRadius: 20, // Top corners only
    borderTopRightRadius: 20, // Top corners only
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15, // Enhanced shadow intensity
    shadowRadius: 8, // Enhanced shadow range
    elevation: 8, // Enhanced Android shadow
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
    backgroundColor: '#F5DAB2', // Light orange background
    borderWidth: 1.5, // Thin border width
    borderColor: Colors.primary, // Orange border color
    paddingVertical: 14, // Increased vertical padding
    paddingHorizontal: 24, // Increased horizontal padding
    borderRadius: 12, // Rounded corners
    gap: 10, // Spacing between icon and text
    marginTop: 16, // Top margin
    shadowColor: '#EF8059', // Orange shadow color
    shadowOffset: { width: 0, height: 3 }, // Shadow offset
    shadowOpacity: 0.2, // Shadow opacity
    shadowRadius: 6, // Shadow blur radius
    elevation: 4, // Android shadow elevation
  },
  viewDetailsButtonText: {
    fontSize: 17, // Slightly larger font size
    fontWeight: '700', // Bold font weight
    color: '#D67635', // Darker orange color for better contrast
    letterSpacing: 0.5, // Letter spacing for better readability
  },
});
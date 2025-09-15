import React, { useState, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
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
  const mapRef = useRef<MapView>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [region, setRegion] = useState<Region>(MELBOURNE_REGION);
  const [showSearchArea, setShowSearchArea] = useState(false);
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
    mapRef.current?.animateToRegion({
      latitude: company.latitude,
      longitude: company.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
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
    if (!hasActiveFilters()) {
      setShowSearchArea(true);
    }
  };

  const handleSearchInArea = () => {
    setShowSearchArea(false);
    console.log('Searching in area:', region);
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
      <SearchBarWithDropdown
        value={searchText}
        onChangeText={handleSearchChange}
        onSelectCompany={handleCompanySelection}
        onFilter={() => setFilterModalVisible(true)}
        companies={mockCompanies}
        placeholder="Search companies on map..."
      />
      
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
            onPress={() => handleMarkerPress(company)}
            pinColor={getMarkerColor(company)}
          >
            <Callout style={styles.callout}>
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
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

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

      {showSearchArea && !hasActiveFilters() && (
        <TouchableOpacity
          style={styles.searchAreaButton}
          onPress={handleSearchInArea}
        >
          <Ionicons name="search" size={16} color={Colors.white} />
          <Text style={styles.searchAreaText}>Search this area</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={() => {
          mapRef.current?.animateToRegion(MELBOURNE_REGION, 500);
        }}
      >
        <Ionicons name="locate" size={24} color={Colors.primary} />
      </TouchableOpacity>

      {selectedCompany && (
        <View style={styles.companyDetail}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedCompany(null)}
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
        </View>
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
    flex: 1,
  },
  filterBar: {
    position: 'absolute',
    top: 100,  // Changed from 60 to 100 to position it lower
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
    width: 200,
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
  searchAreaButton: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchAreaText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 100,
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
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
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
    marginTop: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
    marginLeft: 4,
  },
});
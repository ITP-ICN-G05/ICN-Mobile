import React, { useState, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/common/SearchBar';
import { Colors } from '../../constants/colors';
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

  // Filter companies based on search text only
  const filteredCompanies = useMemo(() => {
    if (!searchText) return mockCompanies;
    const q = searchText.toLowerCase();
    return mockCompanies.filter((company) =>
      company.name.toLowerCase().includes(q) ||
      company.address.toLowerCase().includes(q) ||
      company.keySectors.some((sector) => sector.toLowerCase().includes(q))
    );
  }, [searchText]);

  const zoomToFilteredResults = () => {
    if (filteredCompanies.length === 0) return;

    if (filteredCompanies.length === 1) {
      const c = filteredCompanies[0];
      mapRef.current?.animateToRegion(
        {
          latitude: c.latitude,
          longitude: c.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    } else {
      const lats = filteredCompanies.map((c) => c.latitude);
      const lons = filteredCompanies.map((c) => c.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      mapRef.current?.animateToRegion(
        {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLon + maxLon) / 2,
          latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
          longitudeDelta: Math.max((maxLon - minLon) * 1.5, 0.01),
        },
        500
      );
    }
  };

  const handleMarkerPress = (company: Company) => {
    setSelectedCompany(company);
    mapRef.current?.animateToRegion(
      {
        latitude: company.latitude,
        longitude: company.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    // Only show "Search this area" when no active text search
    if (!searchText) setShowSearchArea(true);
  };

  const handleSearchInArea = () => {
    setShowSearchArea(false);
    // Hook an API call here in a real app
    console.log('Searching in area:', region);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (text === '' || text.length > 2) {
      setTimeout(zoomToFilteredResults, 500);
    }
  };

  const getMarkerColor = (company: Company) => {
    if (searchText && company.name.toLowerCase().includes(searchText.toLowerCase())) {
      return Colors.warning; // highlight matches
    }
    return company.verificationStatus === 'verified' ? Colors.success : Colors.primary;
  };

  const clearSearch = () => {
    setSearchText('');
    mapRef.current?.animateToRegion(MELBOURNE_REGION, 500);
  };

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchText}
        onChangeText={handleSearchChange}
        placeholder="Search companies on map..."
      />

      {/* Results counter (search-only) */}
      {searchText !== '' && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {filteredCompanies.length} companies found
          </Text>
          <TouchableOpacity onPress={clearSearch}>
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
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {filteredCompanies.map((company) => (
          <Marker
            key={company.id}
            coordinate={{ latitude: company.latitude, longitude: company.longitude }}
            onPress={() => handleMarkerPress(company)}
            pinColor={getMarkerColor(company)}
          >
            <Callout style={styles.callout}>
              <View style={styles.calloutContent}>
                <Text style={styles.calloutTitle}>{company.name}</Text>
                <Text style={styles.calloutAddress}>{company.address}</Text>
                <View style={styles.calloutSectors}>
                  {company.keySectors.map((sector, index) => (
                    <Text key={index} style={styles.calloutSector}>
                      {sector}
                    </Text>
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

      {/* No results overlay (search-only) */}
      {filteredCompanies.length === 0 && searchText !== '' && (
        <View style={styles.noResultsOverlay}>
          <Ionicons name="search" size={48} color={Colors.black50} />
          <Text style={styles.noResultsText}>No companies found</Text>
          <Text style={styles.noResultsSubText}>Try adjusting your search</Text>
        </View>
      )}

      {/* Search this area (only when no search text) */}
      {showSearchArea && searchText === '' && (
        <TouchableOpacity style={styles.searchAreaButton} onPress={handleSearchInArea}>
          <Ionicons name="search" size={16} color={Colors.white} />
          <Text style={styles.searchAreaText}>Search this area</Text>
        </TouchableOpacity>
      )}

      {/* My location shortcut */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={() => mapRef.current?.animateToRegion(MELBOURNE_REGION, 500)}
      >
        <Ionicons name="locate" size={24} color={Colors.primary} />
      </TouchableOpacity>

      {/* Bottom sheet details */}
      {selectedCompany && (
        <View style={styles.companyDetail}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedCompany(null)}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  // Search-only bar
  resultsBar: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  resultsText: { fontSize: 14, color: Colors.text },
  clearText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },

  noResultsOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  noResultsText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 16 },
  noResultsSubText: { fontSize: 14, color: Colors.black50, marginTop: 8 },

  callout: { width: 200 },
  calloutContent: { padding: 10 },
  calloutTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  calloutAddress: { fontSize: 12, color: Colors.black50, marginBottom: 8 },
  calloutSectors: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  calloutSector: {
    fontSize: 10,
    color: Colors.primary,
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },

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
  searchAreaText: { color: Colors.white, fontSize: 14, fontWeight: '500' },

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
  closeButton: { position: 'absolute', top: 10, right: 10, padding: 5 },
  detailName: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  detailAddress: { fontSize: 14, color: Colors.black50, marginBottom: 12 },
  sectorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectorChip: { backgroundColor: Colors.orange[400], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  sectorText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  verifiedText: { fontSize: 12, color: Colors.success, marginLeft: 4 },
});

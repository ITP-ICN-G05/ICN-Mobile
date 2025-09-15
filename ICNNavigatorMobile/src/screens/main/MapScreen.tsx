import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform, NativeModules } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/common/SearchBar';
import { Colors, Spacing } from '../../constants/colors';
import { Company } from '../../types';
import { mockCompanies } from '../../data/mockCompanies';

// Conditional import of react-native-maps
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
let Callout: any = null;
let Region: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  Callout = maps.Callout;
  Region = maps.Region;
} catch (error) {
  console.log('react-native-maps not available, using placeholder');
}

const MELBOURNE_REGION: any = {
  latitude: -37.8136,
  longitude: 144.9631,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Check if native maps are available
const isNativeMapsAvailable = () => {
  try {
    return MapView && !!NativeModules.RNCMapsManager;
  } catch {
    return false;
  }
};

// Map placeholder component
const MapPlaceholder = () => (
  <View style={[styles.map, styles.mapPlaceholder]}>
    <View style={styles.placeholderContent}>
      <Ionicons name="map-outline" size={64} color={Colors.black50} />
      <Text style={styles.placeholderText}>Map View</Text>
      <Text style={styles.placeholderSubtext}>
        Map requires native build or physical device{'\n'}Showing placeholder in Expo Go
      </Text>
      <TouchableOpacity style={styles.placeholderButton} onPress={() => console.log('Map placeholder pressed')}>
        <Text style={styles.placeholderButtonText}>View Company List</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function MapScreen() {
  const mapRef = useRef<any>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [region, setRegion] = useState<any>(MELBOURNE_REGION);
  const [showSearchArea, setShowSearchArea] = useState(false);

  const handleMarkerPress = (company: Company) => {
    setSelectedCompany(company);
    mapRef.current?.animateToRegion({
      latitude: company.latitude,
      longitude: company.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  };

  const handleRegionChangeComplete = (newRegion: any) => {
    setRegion(newRegion);
    setShowSearchArea(true);
  };

  const handleSearchInArea = () => {
    console.log('Searching in area:', region);
    setShowSearchArea(false);
    // API call would go here
  };

  const getMarkerColor = (company: Company) => {
    return company.verificationStatus === 'verified' ? Colors.success : Colors.primary;
  };

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search companies on map..."
        onFilter={() => console.log('Filter pressed')}
      />
      
      {isNativeMapsAvailable() ? (
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
          {mockCompanies.map((company) => (
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
                    {company.keySectors.slice(0, 2).map((sector, index) => (
                      <Text key={index} style={styles.calloutSector}>{sector}</Text>
                    ))}
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      ) : (
        <MapPlaceholder />
      )}

      {isNativeMapsAvailable() && showSearchArea && (
        <TouchableOpacity
          style={styles.searchAreaButton}
          onPress={handleSearchInArea}
        >
          <Ionicons name="search" size={16} color={Colors.white} />
          <Text style={styles.searchAreaText}>Search this area</Text>
        </TouchableOpacity>
      )}

      {isNativeMapsAvailable() && (
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={() => {
            mapRef.current?.animateToRegion(MELBOURNE_REGION, 500);
          }}
        >
          <Ionicons name="locate" size={24} color={Colors.primary} />
        </TouchableOpacity>
      )}

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
        </View>
      )}
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
  },
  calloutSector: {
    fontSize: 10,
    color: Colors.primary,
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  searchAreaButton: {
    position: 'absolute',
    top: 80,
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
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  placeholderContent: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: Colors.black50,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  placeholderButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  placeholderButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
});
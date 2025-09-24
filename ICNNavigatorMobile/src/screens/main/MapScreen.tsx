import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Callout, LatLng } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SearchBarWithDropdown from '../../components/common/SearchBarWithDropdown';
import EnhancedFilterModal, { EnhancedFilterOptions } from '../../components/common/EnhancedFilterModal';
import { Colors } from '../../constants/colors';
import { Company } from '../../types';
import { useUserTier } from '../../contexts/UserTierContext';
import icnDataService from '../../services/icnDataService';

const MELBOURNE_REGION: Region = {
  latitude: -37.8136,
  longitude: 144.9631,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const CARD_RAISE = 330; // keep in sync with rightButtonsWithCompanyDetail.bottom

const toNumber = (v: any) => (typeof v === 'string' ? parseFloat(v) : v);
const hasValidCoords = (c: Company) => Number.isFinite(toNumber(c.latitude)) && Number.isFinite(toNumber(c.longitude));

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const { features } = useUserTier();
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

  // Filters
  const [filters, setFilters] = useState<EnhancedFilterOptions>({
    capabilities: [],
    sectors: [],
    distance: 'All',
  });

  // Debounce helper for camera updates
  const zoomTimeout = useRef<NodeJS.Timeout | null>(null);
  const scheduleZoom = (delay = 250) => {
    if (zoomTimeout.current) clearTimeout(zoomTimeout.current);
    zoomTimeout.current = setTimeout(() => {
      zoomToFilteredResults();
    }, delay);
  };
  useEffect(() => () => {
    if (zoomTimeout.current) clearTimeout(zoomTimeout.current);
  }, []);

  // Load ICN data
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        await icnDataService.loadData();
        const loadedCompanies = icnDataService.getCompanies();
        const options = icnDataService.getFilterOptions();
        setCompanies(loadedCompanies);
        setFilterOptions(options);
        if (loadedCompanies.length > 0) setTimeout(() => zoomToAllCompanies(loadedCompanies), 400);
      } catch (e) {
        console.error('Error loading ICN data:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const zoomToAllCompanies = (list: Company[]) => {
    const coords = list
      .filter(hasValidCoords)
      .map(c => ({ latitude: toNumber(c.latitude), longitude: toNumber(c.longitude) }));
    if (coords.length === 0) return;
    if (coords.length === 1) {
      mapRef.current?.animateToRegion({
        latitude: coords[0].latitude,
        longitude: coords[0].longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
      return;
    }
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 80, bottom: CARD_RAISE + 60, left: 80 },
      animated: true,
    });
  };

  // Derived list
  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    // Search
    if (searchText) filtered = icnDataService.searchCompanies(searchText);

    // Capabilities
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

    // Sectors
    if (filters.sectors && filters.sectors.length > 0) {
      filtered = filtered.filter(company =>
        filters.sectors.some(sector =>
          company.keySectors.some(keySector => keySector.toLowerCase().includes(sector.toLowerCase()))
        )
      );
    }

    // State
    if (filters.state && filters.state !== 'All') {
      filtered = filtered.filter(company => company.billingAddress?.state === filters.state);
    }

    // Company type
    if (filters.companyTypes && filters.companyTypes.length > 0) {
      filtered = filtered.filter(company => {

        const capabilityTypes = company.icnCapabilities?.map(cap => cap.capabilityType) || [];
        
        for (const filterType of filters.companyTypes!) {
          // Handle special "Both" case
          if (filterType === 'Both') {
            const hasSupplier = capabilityTypes.some(t => 
              t === 'Supplier' || t === 'Item Supplier' || t === 'Parts Supplier'
            );
            const hasManufacturer = capabilityTypes.some(t => 
              t === 'Manufacturer' || t === 'Manufacturer (Parts)' || t === 'Assembler'
            );
            if (hasSupplier && hasManufacturer) return true;
          }
          // Direct capability type match
          else if (capabilityTypes.includes(filterType as any)) {
            return true;
          }
          // Check for supplier group
          else if (['Supplier', 'Item Supplier', 'Parts Supplier'].includes(filterType)) {
            if (capabilityTypes.some(t => 
              t === 'Supplier' || t === 'Item Supplier' || t === 'Parts Supplier'
            )) return true;
          }
          // Check for manufacturer group
          else if (['Manufacturer', 'Manufacturer (Parts)', 'Assembler'].includes(filterType)) {
            if (capabilityTypes.some(t => 
              t === 'Manufacturer' || t === 'Manufacturer (Parts)' || t === 'Assembler'
            )) return true;
          }
        }
        return false;
      });
    }

    // Distance (rough)
    if (filters.distance !== 'All' && region) {
      let maxKm = 50;
      if (filters.distance.includes('500m')) maxKm = 0.5;
      else if (filters.distance.includes('km')) maxKm = parseInt(filters.distance);
      const kmToDeg = maxKm / 111;
      filtered = filtered.filter(company => {
        if (!hasValidCoords(company)) return false;
        const latDiff = Math.abs(toNumber(company.latitude) - region.latitude);
        const lonDiff = Math.abs(toNumber(company.longitude) - region.longitude);
        const approx = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
        return approx <= kmToDeg;
      });
    }

    // Size (Plus)
    if (filters.companySize && filters.companySize !== 'All' && features.canFilterBySize) {
      filtered = filtered.filter(company => {
        switch (filters.companySize) {
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

    // Certifications (Plus)
    if (filters.certifications?.length && features.canFilterByCertifications) {
      filtered = filtered.filter(company => company.certifications?.some(cert => filters.certifications?.includes(cert)));
    }

    // Diversity (Premium)
    if (filters.ownershipType?.length && features.canFilterByDiversity) {
      filtered = filtered.filter(company => company.ownershipType?.some(o => filters.ownershipType?.includes(o)));
    }
    if (filters.socialEnterprise && features.canFilterByDiversity) {
      filtered = filtered.filter(company => company.socialEnterprise === true);
    }
    if (filters.australianDisability && features.canFilterByDiversity) {
      filtered = filtered.filter(company => company.australianDisabilityEnterprise === true);
    }

    // Revenue/Employees/Local content (Premium)
    if (filters.revenue && features.canFilterByRevenue) {
      const { min = 0, max = 10_000_000 } = filters.revenue;
      filtered = filtered.filter(company => company.revenue !== undefined && company.revenue >= min && company.revenue <= max);
    }
    if (filters.employeeCount && features.canFilterByRevenue) {
      const { min = 0, max = 1000 } = filters.employeeCount;
      filtered = filtered.filter(company => company.employeeCount !== undefined && company.employeeCount >= min && company.employeeCount <= max);
    }
    if (filters.localContentPercentage && filters.localContentPercentage > 0 && features.canFilterByRevenue) {
      filtered = filtered.filter(company => company.localContentPercentage !== undefined && company.localContentPercentage >= (filters.localContentPercentage as number));
    }

    return filtered.filter(hasValidCoords);
  }, [searchText, filters, region, features, companies]);

  // Auto-zoom on dataset changes unless we're in a selection flow
  useEffect(() => {
    if (!isLoading && !isFromDropdownSelection) scheduleZoom(250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCompanies, isLoading]);

  const zoomToFilteredResults = () => {
    const coords: LatLng[] = filteredCompanies.map(c => ({ latitude: toNumber(c.latitude), longitude: toNumber(c.longitude) }));
    if (coords.length === 0) return;
    if (coords.length === 1) {
      mapRef.current?.animateToRegion({
        latitude: coords[0].latitude,
        longitude: coords[0].longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 400);
    } else {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 80, bottom: CARD_RAISE + 60, left: 80 },
        animated: true,
      });
    }
  };

  const handleMarkerPress = (company: Company) => {
    setSelectedCompany(company);
    setIsFromDropdownSelection(false);
    Animated.timing(slideAnimation, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    mapRef.current?.animateToRegion({
      latitude: toNumber(company.latitude),
      longitude: toNumber(company.longitude),
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 400);
  };

  const navigateToDetail = (company: Company) => navigation.navigate('CompanyDetail', { company });
  const handleCalloutPress = (company: Company) => navigateToDetail(company);

  // Selecting from search mirrors a pin tap & keeps text visible
  const handleCompanySelection = (company: Company) => {
    setIsFromDropdownSelection(true);
    setSearchText(company.name);
    handleMarkerPress(company);
    setTimeout(() => setIsFromDropdownSelection(false), 400);
  };

  const handleRegionChangeComplete = (newRegion: Region) => setRegion(newRegion);
  const handleApplyFilters = (newFilters: EnhancedFilterOptions) => { setFilters(newFilters); setFilterModalVisible(false); scheduleZoom(250); };
  const handleSearchChange = (text: string) => { setSearchText(text); setIsFromDropdownSelection(false); if (text === '' || text.length > 2) scheduleZoom(250); };

  const getMarkerColor = (company: Company) => (searchText && company.name.toLowerCase().includes(searchText.toLowerCase()) ? Colors.warning : (company.verificationStatus === 'verified' ? Colors.success : Colors.primary));
  const clearFilters = () => { setIsFromDropdownSelection(false); setFilters({ capabilities: [], sectors: [], distance: 'All' }); mapRef.current?.animateToRegion(MELBOURNE_REGION, 400); };

  const hasAnyFilters = (
    filters.capabilities.length > 0 ||
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
    (filters.localContentPercentage && filters.localContentPercentage > 0)
  );
  const shouldShowFilterBar = hasAnyFilters && !isFromDropdownSelection;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading ICN Companies...</Text>
      </View>
    );
  }

  // Always render the watermark. When a card is open, lift it above the card area; when idle (nothing clicked), keep it near safe-area bottom.
  const watermarkBottom = selectedCompany ? CARD_RAISE + 16 : (insets?.bottom ?? 0) + 24;

  return (
    <View style={styles.container}>
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
        {filteredCompanies.map(company => (
          <Marker
            key={company.id}
            coordinate={{ latitude: toNumber(company.latitude), longitude: toNumber(company.longitude) }}
            onPress={() => handleMarkerPress(company)}
            onCalloutPress={() => handleCalloutPress(company)}
            pinColor={getMarkerColor(company)}
            tracksViewChanges={false}
          >
            <Callout style={styles.callout} onPress={() => navigateToDetail(company)} tooltip={false}>
              <View style={styles.calloutContent}>
                <Text style={styles.calloutTitle} numberOfLines={1}>{company.name}</Text>
                <Text style={styles.calloutAddress} numberOfLines={2}>{company.address}</Text>
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

      {shouldShowFilterBar && (
        <View style={[styles.filterBar, { top: insets.top + 80 }]}>
          <View style={styles.filterInfo}>
            <Text style={styles.filterText}>{filteredCompanies.length} of {companies.length} companies</Text>
          </View>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

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

      {/* Watermark — ALWAYS rendered. Non-interactive. */}
      <View pointerEvents="none" style={[styles.logoWatermark, { bottom: watermarkBottom }]}>
        <Image
          source={require('../../../assets/ICN Logo Source/ICN-logo-full2.png')}
          style={styles.watermarkLogo}
          resizeMode="contain"
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        />
      </View>

      <View style={[styles.rightButtonsContainer, selectedCompany && styles.rightButtonsWithCompanyDetail]}>
        <TouchableOpacity style={styles.filterFloatingButton} onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="filter" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.myLocationButton} onPress={() => mapRef.current?.animateToRegion(MELBOURNE_REGION, 400)}>
          <Ionicons name="locate" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {selectedCompany && (
        <Animated.View style={[styles.companyDetail, { transform: [{ translateY: slideAnimation }] }]}>
          {/* Close button: true 44x44 dp, centered icon, generous hitSlop */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              Animated.timing(slideAnimation, { toValue: 300, duration: 250, useNativeDriver: true }).start(() => setSelectedCompany(null));
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Close company card"
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
          <TouchableOpacity style={styles.viewDetailsButton} onPress={() => navigateToDetail(selectedCompany)}>
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
        onNavigateToPayment={() => navigation.navigate('Payment')}
        filterOptions={filterOptions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white },
  loadingText: { marginTop: 12, fontSize: 16, color: Colors.text },
  map: { ...StyleSheet.absoluteFillObject },
  searchOverlay: { position: 'absolute', left: 0, right: 0, zIndex: 1000 },
  filterBar: { position: 'absolute', left: 16, right: 16, backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  filterInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterText: { fontSize: 14, color: Colors.text },
  clearText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  noResultsOverlay: { position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center' },
  noResultsText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 16 },
  noResultsSubText: { fontSize: 14, color: Colors.black50, marginTop: 8 },
  clearButton: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 20 },
  clearButtonText: { color: Colors.white, fontWeight: '600' },
  callout: { width: 220 },
  calloutContent: { padding: 10 },
  calloutTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  calloutAddress: { fontSize: 12, color: Colors.black50, marginBottom: 8 },
  calloutSectors: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  calloutSector: { fontSize: 10, color: Colors.primary, backgroundColor: Colors.orange[400], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  verifiedIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  verifiedText: { fontSize: 10, color: Colors.success, marginLeft: 4 },
  calloutButton: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.black20, alignItems: 'center' },
  calloutButtonInner: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.orange[400], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  calloutButtonText: { fontSize: 12, color: Colors.primary, fontWeight: '600', textAlign: 'center' },
  rightButtonsContainer: { position: 'absolute', right: 16, bottom: 120, flexDirection: 'column', gap: 16, zIndex: 1001 },
  rightButtonsWithCompanyDetail: { bottom: CARD_RAISE },
  filterFloatingButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  myLocationButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  companyDetail: { zIndex: 1002, position: 'absolute', bottom: 65, left: 0, right: 0, backgroundColor: Colors.white, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 },
  // Close button: true 44x44 dp target and centered icon
  closeButton: { position: 'absolute', top: 4, right: 4, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', zIndex: 1003 },
  detailName: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  detailAddress: { fontSize: 14, color: Colors.black50, marginBottom: 12 },
  sectorContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  sectorChip: { backgroundColor: Colors.orange[400], paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  sectorText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  viewDetailsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5DAB2', borderWidth: 1.5, borderColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, gap: 10, marginTop: 16, shadowColor: '#EF8059', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  viewDetailsButtonText: { fontSize: 17, fontWeight: '700', color: '#D67635', letterSpacing: 0.5 },
  // Watermark stays above the map; non-interactive
  logoWatermark: { position: 'absolute', left: 16, opacity: 0.9, zIndex: 100, elevation: 10 },
  watermarkLogo: { width: 96, height: 40 },
});

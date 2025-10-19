import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Image, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Callout, LatLng } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import SearchBarWithDropdown from '../../components/common/SearchBarWithDropdown';
import EnhancedFilterModal, { EnhancedFilterOptions } from '../../components/common/EnhancedFilterModal';
import { Colors } from '../../constants/colors';
import { Company } from '../../types';
import { useUserTier } from '../../contexts/UserTierContext';
import hybridDataService from '../../services/hybridDataService';
import { normaliseLatLng, hasValidCoords, extractValidCoordinates, diagnoseCoordinates } from '../../utils/coords';
import { useFilter } from '../../contexts/FilterContext';

const MELBOURNE_REGION: Region = {
  latitude: -37.8136,
  longitude: 144.9631,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const AUSTRALIA_REGION: Region = {
  latitude: -25.2744,  // Australia center
  longitude: 133.7751,
  latitudeDelta: 30,   // Cover entire Australia
  longitudeDelta: 30,
};

const CARD_RAISE = 330; // keep in sync with rightButtonsWithCompanyDetail.bottom
const CAMERA_ANIM_MS = 500; // Duration for camera animation when selecting from search

// Coordinate validation now handled by coords utility

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const { features } = useUserTier();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight(); // NEW: use tab bar height for watermark spacing

  // Use global filter context for synchronization with CompaniesScreen
  const { filters, setFilters, clearFilters: clearGlobalFilters } = useFilter();

  const mapRef = useRef<MapView>(null);
  const markerRefs = useRef<Record<string, any>>({});
  const [searchText, setSearchText] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const slideAnimation = useRef(new Animated.Value(300)).current;
  const [region, setRegion] = useState<Region>(MELBOURNE_REGION);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isFromDropdownSelection, setIsFromDropdownSelection] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // ===== Auto-zoom debouncer with selection/camera lock (prevents zoom-out after selecting) =====
  const zoomTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionLockUntil = useRef<number>(0);
  const cameraBusyRef = useRef<boolean>(false); // true while we are animating the camera to a selection

  // NEW: Manual interaction lock — block auto-fit for a short period after user pinch/drag or recenter action
  const manualZoomLockUntil = useRef<number>(0);
  const bumpManualLock = (ms = 4000) => {
    manualZoomLockUntil.current = Date.now() + ms;
    cancelZoomTimeout();
  };

  const cancelZoomTimeout = () => {
    if (zoomTimeout.current) {
      clearTimeout(zoomTimeout.current);
      zoomTimeout.current = null;
    }
  };

  const startSelectionLock = (ms = 1200) => {
    selectionLockUntil.current = Date.now() + ms; // block auto-zoom while we animate to a pin
    cameraBusyRef.current = true;
    cancelZoomTimeout(); // cancel any pending auto-zoom from previous typing/filtering
  };

  const releaseSelectionLockSoon = (ms = 750) => {
    setTimeout(() => {
      cameraBusyRef.current = false;
      selectionLockUntil.current = 0;
    }, ms);
  };

  // scheduleZoom now supports a `force` flag to bypass the manual-zoom lock when the user intentionally changes filters/search
  const scheduleZoom = (delay = 250, force = false) => {
    // Respect selection/camera lock & manual interaction lock
    if (!force && (Date.now() < selectionLockUntil.current || cameraBusyRef.current || Date.now() < manualZoomLockUntil.current)) return;
    cancelZoomTimeout();
    zoomTimeout.current = setTimeout(() => {
      if (!force && (Date.now() < selectionLockUntil.current || cameraBusyRef.current || Date.now() < manualZoomLockUntil.current)) return; // double-check before firing
      zoomToFilteredResults();
    }, delay);
  };

  useEffect(() => () => cancelZoomTimeout(), []);

  // Load ICN data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<{
    sectors: string[];
    states: string[];
    cities: string[];
    capabilities: string[];
    capabilityTypes?: string[];
    itemNames?: string[];
  }>({ sectors: [], states: [], cities: [], capabilities: [] });

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        await hybridDataService.loadData();
        const loadedCompanies = hybridDataService.getCompanies();
        const options = hybridDataService.getFilterOptions();
        setCompanies(loadedCompanies);
        setFilterOptions(options);
        
        // Diagnostic logging for coordinate issues
        diagnoseCoordinates(loadedCompanies, 'Loaded Companies');
        
        if (loadedCompanies.length > 0) setTimeout(() => zoomToAllCompanies(loadedCompanies), 400);
      } catch (e) {
        console.error('Error loading ICN data:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const zoomToAllCompanies = (list: Company[]) => {
    const coords = extractValidCoordinates(list);
    if (coords.length === 0) return;
    if (coords.length === 1) {
      mapRef.current?.animateCamera({ center: coords[0], zoom: 14 }, { duration: 500 });
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
    if (searchText) filtered = hybridDataService.searchCompaniesSync(searchText);

    // Capabilities (now checks itemName)
    if (filters.capabilities.length > 0) {
      filtered = filtered.filter(company =>
        filters.capabilities.some(capability =>
          company.icnCapabilities?.some(cap =>
            cap.itemName.toLowerCase().includes(capability.toLowerCase())
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

    // Company type (simplified - direct match only)
    if (filters.companyTypes && filters.companyTypes.length > 0) {
      filtered = filtered.filter(company => {
        const capabilityTypes = company.icnCapabilities?.map(cap => cap.capabilityType) || [];
        return filters.companyTypes!.some(filterType =>
          capabilityTypes.includes(filterType as any)
        );
      });
    }

    // Distance (rough)
    if (filters.distance !== 'All' && region) {
      let maxKm = 50;
      if (filters.distance.includes('500m')) maxKm = 0.5;
      else if (filters.distance.includes('km')) maxKm = parseInt(filters.distance);
      const kmToDeg = maxKm / 111;
      filtered = filtered.filter(company => {
        const coord = normaliseLatLng(company);
        if (!coord) return false;
        const latDiff = Math.abs(coord.latitude - region.latitude);
        const lonDiff = Math.abs(coord.longitude - region.longitude);
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

  // Auto-zoom on dataset changes — but NEVER while a selection/card is open or camera is animating
  useEffect(() => {
    if (isLoading) return;
    if (selectedCompany) return; // keep focused on the selected company
    if (cameraBusyRef.current) return; // don't fight the camera while it's animating
    if (!isFromDropdownSelection) scheduleZoom(250); // will be skipped if user recently pinched/dragged
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCompanies, isLoading, selectedCompany]);

  const zoomToFilteredResults = () => {
    const coords = extractValidCoordinates(filteredCompanies);
    if (coords.length === 0) return;
    if (coords.length === 1) {
      mapRef.current?.animateCamera({ center: coords[0], zoom: 15 }, { duration: 400 });
    } else {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 80, bottom: CARD_RAISE + 60, left: 80 },
        animated: true,
      });
    }
  };

  // --- Shared close helper so search <-> card can stay in sync ---
  const closeCompanyCard = (opts?: { clearSearch?: boolean; animate?: boolean }) => {
    if (!selectedCompany) return; // only when card is displayed
    
    // Close the map callout when closing the bottom card
    markerRefs.current[selectedCompany.id]?.hideCallout();
    
    const { clearSearch = false, animate = true } = opts || {};

    const doClearSearch = () => {
      // only clear if the search text matches this company (prevents wiping arbitrary queries)
      if (clearSearch && selectedCompany && searchText.trim().toLowerCase() === selectedCompany.name.trim().toLowerCase()) {
        setSearchText('');
      }
    };

    const finish = () => {
      setSelectedCompany(null);
      cameraBusyRef.current = false;
      selectionLockUntil.current = 0;
      // after closing, allow auto-fit again (e.g., show all results) — still respects manual lock
      scheduleZoom(250);
    };

    if (animate) {
      Animated.timing(slideAnimation, { toValue: 300, duration: 250, useNativeDriver: true }).start(() => {
        doClearSearch();
        finish();
      });
    } else {
      doClearSearch();
      finish();
    }
  };

  const animateToCompany = (company: Company) => {
    startSelectionLock(1500);
    setSelectedCompany(company);

    // Slide up the detail card immediately
    Animated.timing(slideAnimation, { toValue: 0, duration: 300, useNativeDriver: true }).start();

    // Smooth camera focus using animateCamera (more reliable than animateToRegion for zoom level)
    const center = normaliseLatLng(company);
    if (center) {
      mapRef.current?.animateCamera({ center, zoom: 15, heading: 0, pitch: 0 }, { duration: 500 });
    }

    // Release the lock slightly after the camera settles
    releaseSelectionLockSoon(1000);
  };

  const handleMarkerPress = (company: Company) => {
    setIsFromDropdownSelection(false);
    animateToCompany(company);
  };

  const navigateToDetail = (company: Company) => navigation.navigate('CompanyDetail', { company });
  const handleCalloutPress = (company: Company) => navigateToDetail(company);

  // Selecting from search: zoom camera first, then reveal card & callout
  const handleCompanySelection = (company: Company) => {
    console.log('[MapScreen] Company selected from search dropdown:', company.name, company.id);
    
    // Close any existing card first (without animation to avoid conflicts)
    if (selectedCompany) {
      closeCompanyCard({ clearSearch: false, animate: false });
    }
    
    setIsFromDropdownSelection(true);
    // DON'T update searchText yet - wait until after camera animation to prevent filteredCompanies recalculation

    // Lock auto-fit during programmatic camera movement
    startSelectionLock(CAMERA_ANIM_MS + 1000);
    cameraBusyRef.current = true;
    bumpManualLock(CAMERA_ANIM_MS + 1000); // Also bump manual lock to prevent auto-zoom interference

    // Step 1: Zoom camera first
    const center = normaliseLatLng(company);
    if (center && mapRef.current) {
      console.log('[MapScreen] Zooming to company coordinates:', {
        company: company.name,
        lat: center.latitude,
        lng: center.longitude,
        mapRefExists: !!mapRef.current
      });
      
      mapRef.current.animateCamera(
        { 
          center, 
          zoom: 15, 
          heading: 0, 
          pitch: 0 
        }, 
        { duration: CAMERA_ANIM_MS }
      );
    } else {
      console.error('[MapScreen] Cannot zoom - Invalid coordinates or missing mapRef:', {
        company: company.name,
        hasCoordinates: !!center,
        hasMapRef: !!mapRef.current,
        rawCoords: { lat: company.latitude, lng: company.longitude }
      });
      
      // Even if zoom fails, still show the company card
    }

    // Step 2: After camera finishes, show card and callout
    setTimeout(() => {
      // NOW update the search text after camera animation
      setSearchText(company.name);
      setSelectedCompany(company);

      // Slide up the detail card
      Animated.timing(slideAnimation, { toValue: 0, duration: 300, useNativeDriver: true }).start();

      // Optionally show the map callout too
      const marker = markerRefs.current[company.id];
      if (marker && marker.showCallout) {
        marker.showCallout();
        console.log('[MapScreen] Showing marker callout for:', company.name);
      } else {
        console.warn('[MapScreen] Marker ref not found or showCallout unavailable for:', company.id);
      }

      cameraBusyRef.current = false;
      releaseSelectionLockSoon(400);
      setIsFromDropdownSelection(false);
      
      console.log('[MapScreen] Company selection complete:', company.name);
    }, CAMERA_ANIM_MS);
  };

  // NOTE: details?.isGesture is supported in recent react-native-maps. We also hook onPanDrag as a fallback.
  const handleRegionChangeComplete = (newRegion: Region, details?: { isGesture?: boolean }) => {
    setRegion(newRegion);
    if (details?.isGesture) bumpManualLock(4000); // user pinched or dragged — keep their zoom for a bit
  };

  const handleApplyFilters = (newFilters: EnhancedFilterOptions) => {
    console.log('[MapScreen] Applying filters:', newFilters);
    setFilters(newFilters);
    setFilterModalVisible(false);
    scheduleZoom(250, true); // force auto-fit on explicit filter changes
  };

  const handleSearchChange = (text: string) => {
    const wasCardOpen = !!selectedCompany;
    setSearchText(text);
    setIsFromDropdownSelection(false);

    // When the search bar is cleared by tapping the "X" AND the card is open, close the card too.
    if (text === '' && wasCardOpen) {
      closeCompanyCard({ clearSearch: false, animate: true });
      return; // let the close handler trigger auto-zoom (still respects manual lock)
    }

    if (text === '' || text.length > 2) scheduleZoom(250, true); // search is an explicit intent — bypass manual lock
  };

  const getMarkerColor = (company: Company) => {
    const baseColor = company.verificationStatus === 'verified' ? Colors.success : Colors.primary;
    
    // Keep default color when card is open or selection from dropdown
    if (selectedCompany || isFromDropdownSelection) return baseColor;
    
    // Only highlight during active typing search (not after selection)
    if (searchText && company.name.toLowerCase().includes(searchText.toLowerCase())) {
      return Colors.warning;
    }
    
    return baseColor;
  };

  const handleRecenterToUserLocation = async () => {
    setIsLocating(true);
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'ICN Navigator needs location access to show your position on the map. Please enable location permissions in your device settings.',
          [{ text: 'OK' }]
        );
        setIsLocating(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Zoom to user location
      bumpManualLock(2500); // Prevent immediate auto-fit after recenter
      mapRef.current?.animateCamera(
        { 
          center: { 
            latitude: location.coords.latitude, 
            longitude: location.coords.longitude 
          }, 
          zoom: 15 
        },
        { duration: 500 }
      );
    } catch (error) {
      console.error('Error getting user location:', error);
      Alert.alert(
        'Location Unavailable',
        'Unable to get your current location. Please ensure location services are enabled and try again.',
        [
          { 
            text: 'Use Default View', 
            onPress: () => {
              // Fallback to Melbourne default view
              bumpManualLock(2500);
              mapRef.current?.animateCamera(
                { 
                  center: { 
                    latitude: MELBOURNE_REGION.latitude, 
                    longitude: MELBOURNE_REGION.longitude 
                  }, 
                  zoom: 11 
                },
                { duration: 400 }
              );
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLocating(false);
    }
  };

  const clearFilters = () => {
    clearGlobalFilters();
    setSearchText('');  // Clear search text
    setIsFromDropdownSelection(false);
    setSelectedCompany(null);
    // Zoom out to show entire Australia view
    bumpManualLock(1500);
    mapRef.current?.animateCamera({ 
      center: { latitude: AUSTRALIA_REGION.latitude, longitude: AUSTRALIA_REGION.longitude }, 
      zoom: 5  // Show entire Australia
    }, { duration: 500 });
  };

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

  // Dynamic button text based on what needs to be cleared
  const getClearButtonText = () => {
    const hasSearch = searchText.trim().length > 0;
    if (hasSearch && hasAnyFilters) return 'Clear All';
    if (hasSearch) return 'Clear Search';
    return 'Clear Filters';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading ICN Companies...</Text>
      </View>
    );
  }

  // Always render the watermark. When a card is open, lift it above the card area.
  // When idle (no card), place it ABOVE the bottom tab bar by a small margin.
  const watermarkBottom = selectedCompany
    ? CARD_RAISE + 16
    : Math.max(tabBarHeight + 12, (insets?.bottom ?? 0) + 24);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={MELBOURNE_REGION}
        onRegionChangeComplete={(r, details) => handleRegionChangeComplete(r, details as any)}
        onPanDrag={() => bumpManualLock(4000)} // fallback for older Android where details?.isGesture is unreliable
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {filteredCompanies.map(company => {
          const coord = normaliseLatLng(company);
          if (!coord) return null; // Skip invalid/out-of-range coordinates
          
          return (
            <Marker
              ref={(ref) => { markerRefs.current[company.id] = ref; }}
              key={company.id}
              coordinate={coord}
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
          );
        })}
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
            <Text style={styles.clearText}>{getClearButtonText()}</Text>
          </TouchableOpacity>
        </View>
      )}

      {filteredCompanies.length === 0 && !isLoading && (
        <View style={styles.noResultsOverlay}>
          <Ionicons name="search" size={48} color={Colors.black50} />
          <Text style={styles.noResultsText}>No companies found</Text>
          <Text style={styles.noResultsSubText}>Try adjusting your filters or search</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>{getClearButtonText()}</Text>
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
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={handleRecenterToUserLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="locate" size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {selectedCompany && (
        <Animated.View style={[styles.companyDetail, { transform: [{ translateY: slideAnimation }] }]}>
          {/* Close button: true 44x44 dp, centered icon, generous hitSlop */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => closeCompanyCard({ clearSearch: true, animate: true })}
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
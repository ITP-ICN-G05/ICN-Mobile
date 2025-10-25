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
  const { filters, setFilters, clearFilters: clearGlobalFilters, hasActiveFilters } = useFilter();

  const mapRef = useRef<MapView>(null);
  const markerRefs = useRef<Record<string, any>>({});
  const [searchText, setSearchText] = useState('');
  const [committedSearchText, setCommittedSearchText] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const slideAnimation = useRef(new Animated.Value(300)).current;
  const [region, setRegion] = useState<Region>(MELBOURNE_REGION);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isFromDropdownSelection, setIsFromDropdownSelection] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false); // Control dropdown visibility
  
  // New state variables for pin rendering control
  const [mapPinMode, setMapPinMode] = useState<'none' | 'selected' | 'area'>('none');
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [currentMapRegion, setCurrentMapRegion] = useState<Region>(MELBOURNE_REGION);
  const [userMovedMap, setUserMovedMap] = useState(false);
  const userIsGesturingRef = useRef(false); // Track touch events
  // Only show the button if user explicitly tapped My Location (recenter)
  const searchAreaArmedRef = useRef(false);
  // Optional: centralize the zoom threshold so you can tweak easily
  const SEARCH_AREA_ZOOM_DELTA = 0.15; // ~zoom >= 12

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

  // Helper function to filter companies within current map bounds
  const getCompaniesInMapBounds = (companies: Company[], region: Region): Company[] => {
    const latMin = region.latitude - region.latitudeDelta / 2;
    const latMax = region.latitude + region.latitudeDelta / 2;
    const lonMin = region.longitude - region.longitudeDelta / 2;
    const lonMax = region.longitude + region.longitudeDelta / 2;
    
    return companies.filter(company => {
      const coord = normaliseLatLng(company);
      if (!coord) return false;
      
      return coord.latitude >= latMin && coord.latitude <= latMax &&
             coord.longitude >= lonMin && coord.longitude <= lonMax;
    });
  };

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
        // console.error('Error loading ICN data:', e);
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

  // Local search fallback when service returns empty
  const localSearchFallback = (list: Company[], query: string): Company[] => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    const pick = (v: any) => (typeof v === 'string' ? v.toLowerCase().includes(q) : false);
    return list.filter(c => {
      const caps = c.icnCapabilities?.map(x => x.itemName) ?? [];
      const sectors = c.keySectors ?? [];
      const city = c.billingAddress?.city ?? '';
      const state = c.billingAddress?.state ?? '';
      return (
        pick(c.name) || pick(c.address) || pick(city) || pick(state) ||
        sectors.some(pick) || caps.some(pick)
      );
    });
  };

  // Derived list
  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    // Search — resilient: try service, then fallback locally
    if (searchText) {
      const svc = hybridDataService.searchCompaniesSync?.(searchText) ?? [];
      filtered = svc.length ? svc : localSearchFallback(companies, searchText);
    }

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

    const result = filtered.filter(hasValidCoords);
    console.log('[MapScreen] Filtered companies:', {
      total: companies.length,
      filtered: result.length,
      hasSearch: !!searchText,
      hasFilters: Object.keys(filters).some(key => {
        const value = filters[key as keyof typeof filters];
        return Array.isArray(value) ? value.length > 0 : !!value;
      })
    });
    return result;
  }, [searchText, filters, region, features, companies]);

  // Determine which markers to render based on mapPinMode
  const markersToRender = useMemo(() => {
    if (mapPinMode === 'none') return [];
    if (mapPinMode === 'selected' && selectedCompany) return [selectedCompany];
    if (mapPinMode === 'area') {
      // Show markers in current viewport matching filters
      return getCompaniesInMapBounds(filteredCompanies, currentMapRegion);
    }
    return [];
  }, [mapPinMode, selectedCompany, filteredCompanies, currentMapRegion]);

  // Auto-zoom disabled - users control map viewport manually
  // useEffect(() => {
  //   if (isLoading) return;
  //   if (selectedCompany) return; // keep focused on the selected company
  //   if (cameraBusyRef.current) return; // don't fight the camera while it's animating
  //   if (isFromDropdownSelection) return; // don't auto-zoom during dropdown selection
  //   scheduleZoom(250); // will be skipped if user recently pinched/dragged
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [filteredCompanies, isLoading, selectedCompany, isFromDropdownSelection]);

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
      setIsFromDropdownSelection(false); // Clear dropdown flag when card closes
      setUserMovedMap(false); // Reset user moved map flag to prevent "Search this area" button from showing after auto-zoom
      setMapPinMode('none'); // Hide all map pins when closing company card
      // after closing, allow auto-fit again (e.g., show all results) — still respects manual lock
      scheduleZoom(400); // Slight delay to ensure state updates complete
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
    // Cancel any pending zoom operations
    cancelZoomTimeout();
    
    startSelectionLock(1500);
    setSelectedCompany(company);

    // Slide up the detail card immediately
    Animated.timing(slideAnimation, { toValue: 0, duration: 300, useNativeDriver: true }).start();

    // Smooth camera focus using animateCamera (more reliable than animateToRegion for zoom level)
    const center = normaliseLatLng(company);
    if (center) {
      mapRef.current?.animateCamera({ center, zoom: 15, heading: 0, pitch: 0 }, { duration: 500 });
    }

    // Show callout after camera animation completes
    setTimeout(() => {
      const marker = markerRefs.current[company.id];
      if (marker && marker.showCallout) {
        // Small delay to ensure marker is ready
        setTimeout(() => {
          if (marker.showCallout) {
            marker.showCallout();
            console.log('[MapScreen] Showing marker callout after animation for:', company.name);
          }
        }, 200); // Increased delay to ensure marker is fully rendered
      } else {
        // console.warn('[MapScreen] Marker ref not found or showCallout unavailable for:', company.id);
      }
      releaseSelectionLockSoon(400);
    }, 800); // Increased wait time for camera animation to complete
  };

  const handleMarkerPress = (company: Company) => {
    console.log('[MapScreen] Marker pressed:', company.name, company.id);
    cancelZoomTimeout(); // Cancel any pending zoom
    setIsFromDropdownSelection(false);
    animateToCompany(company);
    // Also open immediately for tap feedback
    setTimeout(() => markerRefs.current[company.id]?.showCallout?.(), 50);
  };

  const navigateToDetail = (company: Company) => navigation.navigate('CompanyDetail', { company });
  const handleCalloutPress = (company: Company) => navigateToDetail(company);

  // Selecting from search: zoom camera first, then reveal card & callout
  const handleCompanySelection = (company: Company) => {
    console.log('[MapScreen] Company selected from search dropdown:', company.name, company.id);
    
    // Set to show only selected marker mode
    setMapPinMode('selected');
    setUserMovedMap(false);
    setShowSearchAreaButton(false);
    searchAreaArmedRef.current = false;
    setShowDropdown(false); // Hide dropdown after company selection
    
    // CRITICAL: Cancel any pending zoom operations before selecting new company
    cancelZoomTimeout();
    
    // Close any existing card first (without animation to avoid conflicts)
    if (selectedCompany) {
      closeCompanyCard({ clearSearch: false, animate: false });
    }
    
    setIsFromDropdownSelection(true);
    // DON'T update searchText yet - wait until after camera animation to prevent filteredCompanies recalculation

    // Lock auto-fit during programmatic camera movement
    startSelectionLock(CAMERA_ANIM_MS + 1500); // Increased lock time
    cameraBusyRef.current = true;
    bumpManualLock(CAMERA_ANIM_MS + 1500); // Also bump manual lock to prevent auto-zoom interference

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
      // console.error('[MapScreen] Cannot zoom - Invalid coordinates or missing mapRef:', {
      //   company: company.name,
      //   hasCoordinates: !!center,
      //   hasMapRef: !!mapRef.current,
      //   rawCoords: { lat: company.latitude, lng: company.longitude }
      // });
      
      // Even if zoom fails, still show the company card
    }

    // Step 2: After camera finishes, show card and callout
    setTimeout(() => {
      // FIRST: Set selectedCompany to prevent pin highlighting
      setSelectedCompany(company);
      
      // THEN: Update search text (this won't trigger dropdown because selectedCompany is now set)
      setSearchText(company.name);

      // Slide up the detail card
      Animated.timing(slideAnimation, { toValue: 0, duration: 300, useNativeDriver: true }).start();

      // Optionally show the map callout too
      const marker = markerRefs.current[company.id];
      if (marker && marker.showCallout) {
        // Small delay to ensure marker is ready
        setTimeout(() => {
          if (marker.showCallout) {
            marker.showCallout();
            console.log('[MapScreen] Showing marker callout for:', company.name);
          }
        }, 100);
      } else {
        // console.warn('[MapScreen] Marker ref not found or showCallout unavailable for:', company.id);
      }

      cameraBusyRef.current = false;
      releaseSelectionLockSoon(600);
      
      // Clear dropdown selection flag after small delay to ensure all re-renders complete
      setTimeout(() => {
        setIsFromDropdownSelection(false);
        console.log('[MapScreen] Company selection complete:', company.name);
      }, 200);
    }, CAMERA_ANIM_MS);
  };

  // NOTE: details?.isGesture is supported in recent react-native-maps. We also hook onPanDrag as a fallback.
  const handleRegionChangeComplete = (newRegion: Region, details?: { isGesture?: boolean }) => {
    setRegion(newRegion);
    setCurrentMapRegion(newRegion);
    
    // Show button only after user manually moves the map
    if (userMovedMap) {
      const isZoomedIn = newRegion.latitudeDelta < SEARCH_AREA_ZOOM_DELTA;
      // Show button regardless of filters - both with and without filters
      const shouldShow = isZoomedIn && !selectedCompany;
      setShowSearchAreaButton(shouldShow);
    } else {
      if (showSearchAreaButton) setShowSearchAreaButton(false);
    }
  };

  const handleApplyFilters = (newFilters: EnhancedFilterOptions) => {
    console.log('[MapScreen] Applying filters:', newFilters);
    setFilters(newFilters);
    // Let users immediately see that new results are available in their viewport
    setMapPinMode('area'); // show pins right away
    setUserMovedMap(false);
    setFilterModalVisible(false);
  };

  const handleSearchChange = (text: string) => {
    const wasCardOpen = !!selectedCompany;
    setSearchText(text);
    setIsFromDropdownSelection(false);

    // When the search bar is cleared by tapping the "X" AND the card is open, close the card too.
    if (text === '' && wasCardOpen) {
      closeCompanyCard({ clearSearch: false, animate: true });
      setShowDropdown(false); // Hide dropdown when clearing search
      return; // let the close handler trigger auto-zoom (still respects manual lock)
    }

    // Hide dropdown when search is cleared
    if (text === '') {
      setShowDropdown(false);
    }

    // Remove automatic search trigger - only search on button press
    // if (text === '' || text.length > 2) scheduleZoom(250, true); // search is an explicit intent — bypass manual lock
  };

  const handleSearchSubmit = (text: string) => {
    const q = text.trim();
    setSearchText(q);
    setCommittedSearchText(q);
    setMapPinMode('area'); // SHOW markers immediately
    setUserMovedMap(false);
    setShowSearchAreaButton(false); // Only show on recenter
    setIsFromDropdownSelection(false);
    setShowDropdown(true); // Show dropdown after search submit
    
    // Fit camera to results
    setTimeout(() => {
      zoomToFilteredResults();
    }, 100);
  };

  const getMarkerColor = (company: Company) => {
    const baseColor = company.verificationStatus === 'verified' ? Colors.success : Colors.primary;
    
    // Priority 1: If THIS specific company is selected, always use base color
    if (selectedCompany && selectedCompany.id === company.id) {
      return baseColor;
    }
    
    // Priority 2: If dropdown selection in progress, use base color for all
    if (isFromDropdownSelection) {
      return baseColor;
    }
    
    // Priority 3: Only highlight during active typing search (not after selection)
    if (searchText && !selectedCompany && company.name.toLowerCase().includes(searchText.toLowerCase())) {
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
      // console.error('Error getting user location:', error);
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
              // Not armed in error fallback
              searchAreaArmedRef.current = false;
              setShowSearchAreaButton(false);
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLocating(false);
    }
    
    // After zooming to user location, arm the button
    setTimeout(() => {
      // Arm button only after explicit recenter
      searchAreaArmedRef.current = true;
      
      setMapPinMode('none'); // keep pins hidden until user presses button
      setUserMovedMap(false);
      setShowSearchAreaButton(true); // Show button regardless of filters
    }, 600);
  };

  const handleSearchThisArea = () => {
    setMapPinMode('area');
    setShowSearchAreaButton(false);
    // Don't reset userMovedMap so user can continue moving map and see button again
    // We used the armed action, so disarm until next recenter
    searchAreaArmedRef.current = false;
    
    // Don't adjust map position, only show markers in current viewport
  };

  const clearFilters = () => {
    clearGlobalFilters();
    setSearchText('');
    setCommittedSearchText('');
    setMapPinMode('none'); // Hide all markers
    setSelectedCompany(null);
    setUserMovedMap(false);
    setShowSearchAreaButton(false);
    searchAreaArmedRef.current = false;
    
    // Zoom back to Australia overview
    bumpManualLock(1500);
    mapRef.current?.animateCamera({ 
      center: { latitude: AUSTRALIA_REGION.latitude, longitude: AUSTRALIA_REGION.longitude }, 
      zoom: 5 
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
        onPanDrag={() => { setUserMovedMap(true); bumpManualLock(4000); }}
        onTouchStart={() => { userIsGesturingRef.current = true; }}
        onTouchEnd={() => { userIsGesturingRef.current = false; }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {markersToRender.map(company => {
          const coord = normaliseLatLng(company);
          if (!coord) return null; // Skip invalid/out-of-range coordinates
          
          // Use stable key to preserve refs and callouts
          const markerKey = company.id;
          
          return (
            <Marker
              ref={(ref) => { markerRefs.current[company.id] = ref; }}
              key={markerKey}
              identifier={company.id}
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
          onSubmit={handleSearchSubmit}
          onSelectCompany={handleCompanySelection}
          onFilter={undefined}
          companies={companies}
          placeholder="Search companies, locations..."
          showDropdownOnSearch={showDropdown}
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

      {/* Search this area button */}
      {showSearchAreaButton && (
        <TouchableOpacity 
          style={[styles.searchAreaButton, { bottom: selectedCompany ? CARD_RAISE + 16 : tabBarHeight + 16 }]}
          onPress={handleSearchThisArea}
        >
          <Ionicons name="search" size={18} color={Colors.primary} />
          <Text style={styles.searchAreaButtonText}>Search this area</Text>
        </TouchableOpacity>
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
  // Search this area button
  searchAreaButton: { 
    position: 'absolute', 
    alignSelf: 'center', 
    backgroundColor: Colors.white, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 24, 
    borderWidth: 1.5, 
    borderColor: Colors.primary, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 4, 
    elevation: 5, 
    zIndex: 1001 
  },
  searchAreaButtonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: Colors.primary 
  },
  // Watermark stays above the map; non-interactive
  logoWatermark: { position: 'absolute', left: 16, opacity: 0.9, zIndex: 100, elevation: 10 },
  watermarkLogo: { width: 96, height: 40 },
});
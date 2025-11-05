import { useState, useRef, useCallback } from 'react';
import { LatLng, Region } from 'react-native-maps';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { MELBOURNE_REGION, AUSTRALIA_REGION } from '../constants/mapConstants';
import { hasValidCoords, normaliseLatLng } from '@/utils/coords';
import { Company } from '@/types';
import React from 'react';

export function useMapCamera() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(MELBOURNE_REGION);
  const [isLocating, setIsLocating] = useState(false);
  
  // ===== Auto-zoom debouncer with selection/camera lock =====
  const zoomTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionLockUntil = useRef<number>(0);
  const cameraBusyRef = useRef<boolean>(false);
  const manualZoomLockUntil = useRef<number>(0);

  // Add a state to track if it's user interaction
  const isUserInteractionRef = useRef<boolean>(false);

  const bumpManualLock = useCallback((ms = 4000) => {
    manualZoomLockUntil.current = Date.now() + ms;
    cancelZoomTimeout();
  }, []);

  const cancelZoomTimeout = useCallback(() => {
    if (zoomTimeout.current) {
      clearTimeout(zoomTimeout.current);
      zoomTimeout.current = null;
    }
  }, []);

  const startSelectionLock = useCallback((ms = 1200) => {
    selectionLockUntil.current = Date.now() + ms;
    cameraBusyRef.current = true;
    cancelZoomTimeout();
  }, []);

  const releaseSelectionLockSoon = useCallback((ms = 750) => {
    setTimeout(() => {
      cameraBusyRef.current = false;
      selectionLockUntil.current = 0;
    }, ms);
  }, []);

  const scheduleZoom = useCallback((delay = 250, force = false) => {
    if (!force && (Date.now() < selectionLockUntil.current || cameraBusyRef.current || Date.now() < manualZoomLockUntil.current)) return;
    cancelZoomTimeout();
    zoomTimeout.current = setTimeout(() => {
      if (!force && (Date.now() < selectionLockUntil.current || cameraBusyRef.current || Date.now() < manualZoomLockUntil.current)) return;
      // zoomToFilteredResults(); // This would be called here
    }, delay);
  }, []);

  // Fix region change handling
  const handleRegionChangeComplete = useCallback((newRegion: Region, details?: { isGesture?: boolean }) => {
    // Only update region state during user interaction
    if (details?.isGesture) {
      setRegion(newRegion);
      bumpManualLock(4000);
      isUserInteractionRef.current = true;
      
      // Reset user interaction flag
      setTimeout(() => {
        isUserInteractionRef.current = false;
      }, 1000);
    }
  }, [bumpManualLock]);

  // Add programmatic region change function
  const animateToRegion = useCallback((newRegion: Region, duration = 500) => {
    if (!mapRef.current) return;
    
    // Set camera busy flag to prevent auto-zoom interference
    cameraBusyRef.current = true;
    startSelectionLock(duration + 500);
    
    mapRef.current.animateToRegion(newRegion, duration);
    
    // Update region state, but mark as non-user interaction
    setRegion(newRegion);
    
    // Release lock
    setTimeout(() => {
      cameraBusyRef.current = false;
      selectionLockUntil.current = 0;
    }, duration + 100);
  }, [startSelectionLock]);

  // Add animate to coordinates function
  const animateToCoordinates = useCallback((coordinates: LatLng[], edgePadding?: any) => {
    if (!mapRef.current || coordinates.length === 0) return;
    
    cameraBusyRef.current = true;
    startSelectionLock(1500);
    
    if (coordinates.length === 1) {
      mapRef.current.animateCamera(
        {
          center: coordinates[0],
          zoom: 15,
          heading: 0,
          pitch: 0
        },
        { duration: 500 }
      );
      
      // Update region state
      setRegion(prev => ({
        ...prev,
        latitude: coordinates[0].latitude,
        longitude: coordinates[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }));
    } else {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: edgePadding || { top: 80, right: 80, bottom: 330 + 60, left: 80 },
        animated: true,
      });
    }
    
    setTimeout(() => {
      cameraBusyRef.current = false;
      selectionLockUntil.current = 0;
    }, 1000);
  }, [startSelectionLock]);

  const handleRecenterToUserLocation = useCallback(async () => {
    setIsLocating(true);
    try {
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

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      bumpManualLock(2500);
      
      // Use new animation function
      animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 500);
      
    } catch (error) {
      console.error('Error getting user location:', error);
      Alert.alert(
        'Location Unavailable',
        'Unable to get your current location. Please ensure location services are enabled and try again.',
        [
          { 
            text: 'Use Default View', 
            onPress: () => {
              bumpManualLock(2500);
              animateToRegion(MELBOURNE_REGION, 400);
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLocating(false);
    }
  }, [bumpManualLock, animateToRegion]);

  // Add function to clear all companies
  const zoomToAllCompanies = useCallback((companies: Company[]) => {
    const coords = companies
      .map(company => {
        const coord = normaliseLatLng(company);
        return coord && hasValidCoords(company) ? coord : null;
      })
      .filter(Boolean) as LatLng[];
    
    if (coords.length === 0) return;
    
    animateToCoordinates(coords);
  }, [animateToCoordinates]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => cancelZoomTimeout();
  }, []);

  return {
    mapRef,
    region,
    isLocating,
    handleRegionChangeComplete,
    handleRecenterToUserLocation,
    bumpManualLock,
    startSelectionLock,
    releaseSelectionLockSoon,
    scheduleZoom,
    cancelZoomTimeout,
    animateToRegion,
    animateToCoordinates,
    zoomToAllCompanies
  };
}
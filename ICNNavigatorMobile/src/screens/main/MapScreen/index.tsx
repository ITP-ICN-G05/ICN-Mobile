import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import MapViewComponent from './components/MapViewComponent';
import SearchAndFilterBar from './components/SearchAndFilterBar';
import CompanyDetailCard from './components/CompanyDetailCard';
import MapControls from './components/MapControls';
import LoadingState from './components/LoadingState';
import EnhancedFilterModal, { EnhancedFilterOptions } from '@/components/common/EnhancedFilterModal';

import { useMapData } from './hooks/useMapData';
import { useMapFilters } from './hooks/useMapFilters';
import { useCompanySelection } from './hooks/useCompanySelection';
import { useMapCamera } from './hooks/useMapCamera';
import { Colors } from '@/constants/colors';
import { extractValidCoordinates, normaliseLatLng, hasValidCoords } from '@/utils/coords';
import { Company } from '@/types';
import { AUSTRALIA_REGION } from './constants/mapConstants';

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const {
    companies,
    isLoading,
    filterOptions
  } = useMapData();

  const {
    filters,
    filteredCompanies,
    searchText,
    setSearchText,
    filterModalVisible,
    handleSearchChange,
    handleApplyFilters,
    setFilterModalVisible,
    clearFilters,
    hasAnyFilters
  } = useMapFilters(companies);

  const {
    selectedCompany,
    isFromDropdownSelection,
    markerRefs,
    slideAnimation,
    handleCompanySelection,
    handleMarkerPress,
    handleCalloutPress,
    closeCompanyCard,
    navigateToDetail
  } = useCompanySelection(navigation);

  const {
    mapRef,
    region,
    isLocating,
    handleRegionChangeComplete,
    handleRecenterToUserLocation,
    bumpManualLock,
    animateToRegion,
    animateToCoordinates,
    zoomToAllCompanies
  } = useMapCamera();

  // Add auto-zoom effect
  useEffect(() => {
    if (isLoading || selectedCompany) return;
    
    // Auto-zoom when filter results change
    const coords = extractValidCoordinates(filteredCompanies);
    if (coords.length > 0) {
      setTimeout(() => {
        animateToCoordinates(coords);
      }, 300);
    }
  }, [filteredCompanies, isLoading, selectedCompany]);

  // Handle map animation when company is selected
  const handleCompanySelect = (company: Company) => {
    handleCompanySelection(company, setSearchText);
    
    // Animate to selected company
    const center = normaliseLatLng(company);
    if (center && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center,
          zoom: 15,
          heading: 0,
          pitch: 0
        },
        { duration: 500 }
      );
    }
  };

  // Handle map behavior when clearing filters
  const handleClearFilters = () => {
    clearFilters();
    setFilterModalVisible(false);
    
    // Zoom to all companies or default view after clearing filters
    if (companies.length > 0) {
      setTimeout(() => {
        zoomToAllCompanies(companies);
      }, 200);
    } else {
      animateToRegion(AUSTRALIA_REGION, 500);
    }
  };

  // Wrap close card handler function
  const handleCloseCompanyCard = (opts?: { clearSearch?: boolean; animate?: boolean }) => {
    closeCompanyCard(searchText, setSearchText, opts);
    
    // After closing card, if there are filter results, zoom to all results
    if (filteredCompanies.length > 0) {
      setTimeout(() => {
        const coords = extractValidCoordinates(filteredCompanies);
        if (coords.length > 0) {
          animateToCoordinates(coords);
        }
      }, 300);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const handleApplyFiltersWithNavigation = (newFilters: EnhancedFilterOptions) => {
    handleApplyFilters(newFilters, navigation);
  };

  return (
    <View style={styles.container}>
      <MapViewComponent
        companies={filteredCompanies}
        selectedCompany={selectedCompany}
        isFromDropdownSelection={isFromDropdownSelection}
        searchText={searchText}
        region={region}
        mapRef={mapRef}
        markerRefs={markerRefs}
        onMarkerPress={handleMarkerPress}
        onCompanySelect={handleCompanySelect}
        onCalloutPress={handleCalloutPress}
        onRegionChangeComplete={handleRegionChangeComplete}
        onRecenter={handleRecenterToUserLocation}
        bumpManualLock={bumpManualLock}
      />

      <SearchAndFilterBar
        insets={insets}
        searchText={searchText}
        onSearchChange={handleSearchChange}
        onFilterPress={() => setFilterModalVisible(true)}
        filteredCount={filteredCompanies.length}
        totalCount={companies.length}
        hasAnyFilters={hasAnyFilters}
        onClearFilters={handleClearFilters}
        selectedCompany={selectedCompany}
        isFromDropdownSelection={isFromDropdownSelection}
      />

      <CompanyDetailCard
        company={selectedCompany}
        onClose={handleCloseCompanyCard}
        onViewDetails={navigateToDetail}
        searchText={searchText}
        slideAnimation={slideAnimation}
      />

      <MapControls
        onFilterPress={() => setFilterModalVisible(true)}
        onLocationPress={handleRecenterToUserLocation}
        isLocating={isLocating}
        selectedCompany={selectedCompany}
      />

      <EnhancedFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFiltersWithNavigation}
        currentFilters={filters}
        onNavigateToPayment={() => navigation.navigate('Payment')}
        filterOptions={filterOptions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white }
});
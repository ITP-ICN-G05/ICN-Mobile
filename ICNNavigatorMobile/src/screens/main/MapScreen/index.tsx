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

  // 添加自动缩放效果
  useEffect(() => {
    if (isLoading || selectedCompany) return;
    
    // 当筛选结果变化时自动缩放
    const coords = extractValidCoordinates(filteredCompanies);
    if (coords.length > 0) {
      setTimeout(() => {
        animateToCoordinates(coords);
      }, 300);
    }
  }, [filteredCompanies, isLoading, selectedCompany]);

  // 处理公司选择时的地图动画
  const handleCompanySelect = (company: Company) => {
    handleCompanySelection(company, setSearchText);
    
    // 动画到选定的公司
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

  // 处理清除筛选时的地图行为
  const handleClearFilters = () => {
    clearFilters();
    setFilterModalVisible(false);
    
    // 清除筛选后缩放到所有公司或默认视图
    if (companies.length > 0) {
      setTimeout(() => {
        zoomToAllCompanies(companies);
      }, 200);
    } else {
      animateToRegion(AUSTRALIA_REGION, 500);
    }
  };

  // 包装关闭卡片处理函数
  const handleCloseCompanyCard = (opts?: { clearSearch?: boolean; animate?: boolean }) => {
    closeCompanyCard(searchText, setSearchText, opts);
    
    // 关闭卡片后，如果有筛选结果，缩放到所有结果
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
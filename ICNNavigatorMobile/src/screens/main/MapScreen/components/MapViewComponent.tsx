import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps';

import CompanyMarker from './CompanyMarker';
import Watermark from './Watermark';
import { MELBOURNE_REGION } from '../constants/mapConstants';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Company } from '@/types';
import { Colors } from '@/constants/colors';

interface Props {
  companies: Company[];
  selectedCompany: Company | null;
  isFromDropdownSelection: boolean;
  searchText: string;
  region: Region;
  mapRef: React.RefObject<MapView>;
  markerRefs: React.MutableRefObject<Record<string, any>>;
  onMarkerPress: (company: Company) => void;
  onCompanySelect: (company: Company) => void;
  onCalloutPress: (company: Company) => void;
  onRegionChangeComplete: (region: Region, details?: any) => void;
  onRecenter: () => Promise<void>;
  bumpManualLock: (ms?: number) => void;
}

export default function MapViewComponent({
  companies,
  selectedCompany,
  isFromDropdownSelection,
  searchText,
  region,
  mapRef,
  markerRefs,
  onMarkerPress,
  onCompanySelect,
  onCalloutPress,
  onRegionChangeComplete,
  bumpManualLock
}: Props) {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const handlePanDrag = () => {
    bumpManualLock(4000);
  };

  // 修复：移除 region 属性，使用 initialRegion 代替
  return (
    <>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={MELBOURNE_REGION}
        // 移除 region 属性，让地图自己管理状态
        // region={region} // 这行注释掉或删除
        onRegionChangeComplete={onRegionChangeComplete}
        onPanDrag={handlePanDrag}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        // 添加这些属性来改善地图行为
        moveOnMarkerPress={false}
        loadingEnabled={true}
        loadingIndicatorColor={Colors.primary}
        loadingBackgroundColor={Colors.white}
      >
        {companies.map(company => (
          <CompanyMarker
            key={company.id}
            company={company}
            isSelected={selectedCompany?.id === company.id}
            isFromDropdownSelection={isFromDropdownSelection}
            searchText={searchText}
            markerRefs={markerRefs}
            onPress={onMarkerPress}
            onCalloutPress={onCalloutPress}
          />
        ))}
      </MapView>

      <Watermark 
        selectedCompany={selectedCompany}
        tabBarHeight={tabBarHeight}
        insets={insets}
      />
    </>
  );
}

const styles = StyleSheet.create({
  map: { ...StyleSheet.absoluteFillObject }
});
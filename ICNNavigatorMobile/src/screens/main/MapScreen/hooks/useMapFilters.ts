import { useState, useMemo, useEffect } from 'react';
import { useFilter } from '@/contexts/FilterContext';
import { useUserTier } from '@/contexts/UserTierContext';
import hybridDataService from '@/services/hybridDataService';
import { hasValidCoords, normaliseLatLng, extractValidCoordinates } from '@/utils/coords';
import { EnhancedFilterOptions } from '@/components/common/EnhancedFilterModal';
import { AUSTRALIA_REGION } from '../constants/mapConstants';
import { Company } from '@/types';

export function useMapFilters(companies: Company[]) {
  const { features } = useUserTier();
  const { filters, setFilters, clearFilters: clearGlobalFilters } = useFilter();
  
  const [searchText, setSearchText] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [region, setRegion] = useState(AUSTRALIA_REGION);

  // 确保返回严格的布尔值
  const hasAnyFilters = useMemo((): boolean => {
    return Boolean(
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
  }, [filters]);

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

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const handleApplyFilters = (newFilters: EnhancedFilterOptions, navigation: any) => {
    console.log('[MapScreen] Applying filters:', newFilters);
    setFilters(newFilters);
    setFilterModalVisible(false);
  };

  const clearFilters = () => {
    clearGlobalFilters();
    setSearchText('');
  };

  return {
    filters,
    filteredCompanies,
    searchText,
    setSearchText,
    filterModalVisible,
    region,
    setRegion,
    handleSearchChange,
    handleApplyFilters,
    setFilterModalVisible,
    clearFilters,
    hasAnyFilters
  };
}
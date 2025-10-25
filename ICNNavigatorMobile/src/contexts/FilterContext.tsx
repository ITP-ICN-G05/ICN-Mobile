import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { EnhancedFilterOptions } from '../components/common/EnhancedFilterModal';

/**
 * FilterContext
 * Global state management for filters shared between CompaniesScreen and MapScreen.
 * Provides real-time synchronization of filter state across different views.
 */

interface FilterContextType {
  filters: EnhancedFilterOptions;
  setFilters: (filters: EnhancedFilterOptions) => void;
  updateFilter: <K extends keyof EnhancedFilterOptions>(key: K, value: EnhancedFilterOptions[K]) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Default filter state - shows all data
const DEFAULT_FILTERS: EnhancedFilterOptions = {
  capabilities: [],
  sectors: [],
  distance: 'All',
  state: undefined,
  companyTypes: undefined,
  companySize: undefined,
  certifications: undefined,
  ownershipType: undefined,
  revenue: undefined,
  employeeCount: undefined,
  socialEnterprise: undefined,
  australianDisability: undefined,
  localContentPercentage: undefined,
};

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = useState<EnhancedFilterOptions>(DEFAULT_FILTERS);

  /**
   * Set all filters at once
   */
  const setFilters = useCallback((newFilters: EnhancedFilterOptions) => {
    setFiltersState(newFilters);
  }, []);

  /**
   * Update a single filter property
   */
  const updateFilter = useCallback(<K extends keyof EnhancedFilterOptions>(
    key: K,
    value: EnhancedFilterOptions[K]
  ) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Clear all filters and reset to default state
   */
  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  /**
   * Check if any filters are active
   * Properly detects empty filters vs active filters
   */
  const hasActiveFilters = useMemo(() => {
    // Check each filter against its default value
    return (
      (filters.capabilities && filters.capabilities.length > 0) ||
      (filters.sectors && filters.sectors.length > 0) ||
      (filters.state && filters.state !== undefined && filters.state !== 'All') ||
      (filters.companyTypes && filters.companyTypes.length > 0) ||
      (filters.distance && filters.distance !== 'All') ||
      (filters.companySize && filters.companySize !== undefined && filters.companySize !== 'All') ||
      (filters.certifications && filters.certifications.length > 0) ||
      (filters.ownershipType && filters.ownershipType.length > 0) ||
      filters.socialEnterprise === true ||
      filters.australianDisability === true ||
      (filters.revenue && (filters.revenue.min > 0 || filters.revenue.max < 10000000)) ||
      (filters.employeeCount && (filters.employeeCount.min > 0 || filters.employeeCount.max < 1000)) ||
      (filters.localContentPercentage !== undefined && filters.localContentPercentage > 0)
    );
  }, [filters]);

  const value: FilterContextType = {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

/**
 * Hook to use filter context
 * Must be used within FilterProvider
 */
export const useFilter = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within FilterProvider');
  }
  return context;
};

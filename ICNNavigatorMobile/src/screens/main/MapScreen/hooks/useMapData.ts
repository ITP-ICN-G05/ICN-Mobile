import { useState, useEffect } from 'react';
import hybridDataService from '@/services/hybridDataService';
import { diagnoseCoordinates } from '@/utils/coords';
import { Company } from '@/types';

export function useMapData() {
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await hybridDataService.loadData();
      const loadedCompanies = hybridDataService.getCompanies();
      const options = hybridDataService.getFilterOptions();
      
      setCompanies(loadedCompanies);
      setFilterOptions(options);
      
      // Diagnostic logging for coordinate issues
      diagnoseCoordinates(loadedCompanies, 'Loaded Companies');
    } catch (error) {
      console.error('Error loading ICN data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    companies,
    isLoading,
    filterOptions
  };
}
import { useState, useMemo } from 'react';
import { Company } from '../types';
import { filterCompaniesBySearch } from '../utils/companyUtils';

export interface FilterOptions {
  capabilities: string[];
  distance: string;
  verificationStatus: 'all' | 'verified' | 'unverified';
}

export interface UseCompanySearchReturn {
  searchText: string;
  setSearchText: (text: string) => void;
  filteredCompanies: Company[];
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
}

export function useCompanySearch(companies: Company[]): UseCompanySearchReturn {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    capabilities: [],
    distance: 'All',
    verificationStatus: 'all'
  });

  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    // Apply search text filter
    if (searchText) {
      filtered = filterCompaniesBySearch(filtered, searchText);
    }

    // Apply capability filter
    if (filters.capabilities.length > 0) {
      filtered = filtered.filter(company =>
        filters.capabilities.some(capability =>
          company.keySectors.includes(capability) ||
          company.keySectors.some(sector =>
            sector.toLowerCase().includes(capability.toLowerCase())
          )
        )
      );
    }

    // Apply verification status filter
    if (filters.verificationStatus !== 'all') {
      filtered = filtered.filter(company => 
        company.verificationStatus === filters.verificationStatus
      );
    }

    return filtered;
  }, [companies, searchText, filters]);

  return {
    searchText,
    setSearchText,
    filteredCompanies,
    filters,
    setFilters
  };
}
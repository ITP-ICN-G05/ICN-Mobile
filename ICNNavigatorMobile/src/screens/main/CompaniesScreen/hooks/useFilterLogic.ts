import { useMemo } from 'react';
import { Company } from '../../../../types';
import { EnhancedFilterOptions } from '../../../../components/common/EnhancedFilterModal';
import { normaliseState, extractCompanySectors } from '../utils/filterHelpers';

interface UseFilterLogicProps {
  companies: Company[];
  searchResults: Company[];
  searchText: string;
  filters: EnhancedFilterOptions;
  features: any;
}

export const useFilterLogic = ({
  companies,
  searchResults,
  searchText,
  filters,
  features
}: UseFilterLogicProps) => {
  const filteredCompanies = useMemo(() => {
    // Start with search results or all companies
    let filtered = searchText ? searchResults : companies;

    // Apply capability filter (using ICN capabilities)
    if (filters.capabilities.length > 0) {
      filtered = filtered.filter(company =>
        filters.capabilities.some(capability =>
          company.capabilities?.some(cap => 
            cap.toLowerCase().includes(capability.toLowerCase())
          ) ||
          company.icnCapabilities?.some(cap =>
            cap.itemName.toLowerCase().includes(capability.toLowerCase()) ||
            cap.detailedItemName.toLowerCase().includes(capability.toLowerCase())
          )
        )
      );
    }

    // Apply sector filter
    if (filters.sectors && filters.sectors.length > 0) {
      const wantedSectors = filters.sectors
        .filter(s => s !== 'All')
        .map(s => s.toLowerCase());
      
      if (wantedSectors.length > 0) {
        filtered = filtered.filter(company => {
          const companySectors = extractCompanySectors(company);
          return wantedSectors.some(wanted => 
            companySectors.some(have => have.includes(wanted))
          );
        });
      }
    }

    // Apply state filter
    if (filters.state && filters.state !== 'All') {
      const targetState = normaliseState(filters.state);
      if (targetState) {
        filtered = filtered.filter(company => 
          normaliseState(company.billingAddress?.state) === targetState
        );
      }
    }

    // Apply company type filter (ICN capability types)
    if (filters.companyTypes && filters.companyTypes.length > 0) {
      filtered = filtered.filter(company => {
        const capabilityTypes = company.icnCapabilities?.map(cap => cap.capabilityType) || [];
        
        for (const filterType of filters.companyTypes!) {
          // Handle special "Both" case
          if (filterType === 'Both') {
            const hasSupplier = capabilityTypes.some(t => 
              t === 'Supplier' || t === 'Item Supplier' || t === 'Parts Supplier'
            );
            const hasManufacturer = capabilityTypes.some(t => 
              t === 'Manufacturer' || t === 'Manufacturer (Parts)' || t === 'Assembler'
            );
            if (hasSupplier && hasManufacturer) return true;
          }
          // Direct capability type match
          else if (capabilityTypes.includes(filterType as any)) {
            return true;
          }
          // Check for supplier group
          else if (['Supplier', 'Item Supplier', 'Parts Supplier'].includes(filterType)) {
            if (capabilityTypes.some(t => 
              t === 'Supplier' || t === 'Item Supplier' || t === 'Parts Supplier'
            )) return true;
          }
          // Check for manufacturer group
          else if (['Manufacturer', 'Manufacturer (Parts)', 'Assembler'].includes(filterType)) {
            if (capabilityTypes.some(t => 
              t === 'Manufacturer' || t === 'Manufacturer (Parts)' || t === 'Assembler'
            )) return true;
          }
        }
        return false;
      });
    }

    // Apply company size filter (Plus tier only)
    if (filters.companySize && filters.companySize !== 'All' && features.canFilterBySize) {
      filtered = filtered.filter(company => {
        switch(filters.companySize) {
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

    // Apply certification filter (Plus tier only)
    if (filters.certifications?.length && features.canFilterByCertifications) {
      filtered = filtered.filter(company =>
        company.certifications?.some(cert => 
          filters.certifications?.includes(cert)
        )
      );
    }

    // Apply ownership type filter (Premium tier only)
    if (filters.ownershipType?.length && features.canFilterByDiversity) {
      filtered = filtered.filter(company =>
        company.ownershipType?.some(ownership =>
          filters.ownershipType?.includes(ownership)
        )
      );
    }

    // Apply social enterprise filter (Premium tier only)
    if (filters.socialEnterprise && features.canFilterByDiversity) {
      filtered = filtered.filter(company => company.socialEnterprise === true);
    }

    // Apply Australian Disability Enterprise filter (Premium tier only)
    if (filters.australianDisability && features.canFilterByDiversity) {
      filtered = filtered.filter(company => company.australianDisabilityEnterprise === true);
    }

    // Apply revenue filter (Premium tier only)
    if (filters.revenue && features.canFilterByRevenue) {
      const { min = 0, max = 10000000 } = filters.revenue;
      filtered = filtered.filter(company =>
        company.revenue !== undefined && 
        company.revenue >= min && 
        company.revenue <= max
      );
    }

    // Apply employee count filter (Premium tier only)
    if (filters.employeeCount && features.canFilterByRevenue) {
      const { min = 0, max = 1000 } = filters.employeeCount;
      filtered = filtered.filter(company =>
        company.employeeCount !== undefined && 
        company.employeeCount >= min && 
        company.employeeCount <= max
      );
    }

    // Apply local content percentage filter (Premium tier only)
    if (filters.localContentPercentage && filters.localContentPercentage > 0 && features.canFilterByRevenue) {
      const minLocalContent = filters.localContentPercentage;
      filtered = filtered.filter(company =>
        company.localContentPercentage !== undefined && 
        company.localContentPercentage >= minLocalContent
      );
    }

    return filtered;
  }, [companies, searchResults, searchText, filters, features]);

  return filteredCompanies;
};
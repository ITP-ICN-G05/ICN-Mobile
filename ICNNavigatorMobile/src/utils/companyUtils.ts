import { Company } from '../types';

/**
 * Filters companies by search text across name, address, and sectors
 */
export function filterCompaniesBySearch(companies: Company[], searchText: string): Company[] {
  if (!searchText.trim()) {
    return companies;
  }

  const lowercaseSearch = searchText.toLowerCase();

  return companies.filter(company => 
    company.name.toLowerCase().includes(lowercaseSearch) ||
    company.address.toLowerCase().includes(lowercaseSearch) ||
    company.keySectors.some(sector => 
      sector.toLowerCase().includes(lowercaseSearch)
    )
  );
}

/**
 * Sorts companies alphabetically by name
 */
export function sortCompaniesByName(companies: Company[]): Company[] {
  return [...companies].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Validates company data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateCompanyData(company: { name?: string; address?: string }): ValidationResult {
  const errors: string[] = [];

  if (!company.name || company.name.trim() === '') {
    errors.push('Name is required');
  }

  if (!company.address || company.address.trim() === '') {
    errors.push('Address is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculates distance between two geographic points
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  
  return distance;
}
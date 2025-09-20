import { filterCompaniesBySearch, sortCompaniesByName, validateCompanyData, calculateDistance } from '../companyUtils';
import { Company } from '../../types';

describe('Company Utilities', () => {
  const mockCompanies: Company[] = [
    {
      id: '1',
      name: 'ABC Construction Ltd',
      address: '123 Smith Street, Melbourne, VIC 3000',
      verificationStatus: 'verified',
      keySectors: ['Supplier', 'Construction'],
      latitude: -37.8136,
      longitude: 144.9631,
    },
    {
      id: '2', 
      name: 'XYZ Engineering',
      address: '456 Collins Street, Melbourne, VIC 3000',
      verificationStatus: 'unverified',
      keySectors: ['Engineering', 'Consulting'],
      latitude: -37.8140,
      longitude: 144.9633,
    }
  ];

  describe('filterCompaniesBySearch', () => {
    it('should filter companies by name (case insensitive)', () => {
      const result = filterCompaniesBySearch(mockCompanies, 'abc');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('ABC Construction Ltd');
    });

    it('should filter companies by address', () => {
      const result = filterCompaniesBySearch(mockCompanies, 'Collins');
      expect(result).toHaveLength(1);
      expect(result[0].address).toContain('Collins Street');
    });

    it('should filter companies by sectors', () => {
      const result = filterCompaniesBySearch(mockCompanies, 'Engineering');
      expect(result).toHaveLength(1);
      expect(result[0].keySectors).toContain('Engineering');
    });

    it('should return empty array for no matches', () => {
      const result = filterCompaniesBySearch(mockCompanies, 'NonexistentTerm');
      expect(result).toHaveLength(0);
    });

    it('should return all companies for empty search', () => {
      const result = filterCompaniesBySearch(mockCompanies, '');
      expect(result).toHaveLength(2);
    });

    it('should return all companies for whitespace only search', () => {
      const result = filterCompaniesBySearch(mockCompanies, '   ');
      expect(result).toHaveLength(2);
    });
  });

  describe('sortCompaniesByName', () => {
    it('should sort companies alphabetically by name', () => {
      const result = sortCompaniesByName([...mockCompanies]);
      expect(result[0].name).toBe('ABC Construction Ltd');
      expect(result[1].name).toBe('XYZ Engineering');
    });

    it('should not mutate original array', () => {
      const original = [...mockCompanies];
      sortCompaniesByName(original);
      expect(original[0].name).toBe('ABC Construction Ltd'); // Original order preserved
    });
  });

  describe('validateCompanyData', () => {
    it('should return error for empty name', () => {
      const company = { name: '', address: 'Valid Address' };
      const result = validateCompanyData(company);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should return error for empty address', () => {
      const company = { name: 'Valid Name', address: '' };
      const result = validateCompanyData(company);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Address is required');
    });

    it('should return multiple errors for invalid data', () => {
      const company = { name: '', address: '' };
      const result = validateCompanyData(company);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Name is required');
      expect(result.errors).toContain('Address is required');
    });

    it('should return valid for complete data', () => {
      const company = { name: 'Valid Name', address: 'Valid Address' };
      const result = validateCompanyData(company);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1 = { lat: -37.8136, lng: 144.9631 };
      const point2 = { lat: -37.8140, lng: 144.9633 };
      
      const result = calculateDistance(point1, point2);
      expect(result).toBeCloseTo(0.05, 2); // Approximately 50 meters
    });

    it('should return 0 for identical points', () => {
      const point = { lat: -37.8136, lng: 144.9631 };
      const result = calculateDistance(point, point);
      expect(result).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const point1 = { lat: -37.8136, lng: 144.9631 };
      const point2 = { lat: -37.8200, lng: 145.0000 };
      
      const result = calculateDistance(point1, point2);
      expect(result).toBeGreaterThan(0);
    });
  });
});
import { Company } from '../../src/types';

export const companies: Company[] = [
  {
    id: 'c1',
    name: 'Alpha Steel',
    address: '123 Test Street, Melbourne, VIC 3000',
    verificationStatus: 'verified',
    verificationDate: '2025-01-01',
    keySectors: ['Manufacturing', 'Supplier'],
    latitude: -37.81,
    longitude: 144.96,
    companyType: 'manufacturer',
    phoneNumber: '+61 3 1111 1111',
    email: 'info@alphasteel.com.au',
  },
  {
    id: 'c2',
    name: 'Beta Health',
    address: '456 Health Ave, Melbourne, VIC 3001',
    verificationStatus: 'verified',
    verificationDate: '2024-12-15',
    keySectors: ['Healthcare', 'Service Provider'],
    latitude: -37.78,
    longitude: 144.97,
    companyType: 'service',
    phoneNumber: '+61 3 2222 2222',
    email: 'contact@betahealth.com.au',
    website: 'www.betahealth.com.au',
  },
  {
    id: 'c3',
    name: 'Gamma Energy',
    address: '789 Power St, Melbourne, VIC 3002',
    verificationStatus: 'unverified',
    keySectors: ['Energy', 'Engineering'],
    latitude: -37.72,
    longitude: 144.90,
    companyType: 'consultant',
    email: 'info@gammaenergy.com.au',
  },
];

// Helper functions for testing
export const getVerifiedCompanies = () => 
  companies.filter(company => company.verificationStatus === 'verified');

export const getCompaniesBySector = (sector: string) =>
  companies.filter(company => 
    company.keySectors.some(s => s.toLowerCase().includes(sector.toLowerCase()))
  );

export const getCompanyById = (id: string) =>
  companies.find(company => company.id === id);

// Mock bookmarked companies for testing bookmark functionality
export const bookmarkedCompanyIds = ['c2']; // Beta Health is bookmarked

export const getBookmarkedCompanies = () =>
  companies.filter(company => bookmarkedCompanyIds.includes(company.id));

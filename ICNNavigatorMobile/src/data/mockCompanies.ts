import { Company } from '../types';

export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'ABC Construction Ltd',
    address: '123 Smith Street, Melbourne, VIC 3000',
    verificationStatus: 'verified',
    verificationDate: '2025-01-07',
    keySectors: ['Supplier', 'Manufacturer'],
    latitude: -37.8136,
    longitude: 144.9631,
    companyType: 'supplier',
    phoneNumber: '+61 3 1234 5678',
    email: 'info@abcconstruction.com.au',
  },
  {
    id: '2',
    name: 'XYZ Engineering',
    address: '456 Collins Street, Melbourne, VIC 3000',
    verificationStatus: 'unverified',
    keySectors: ['Engineering', 'Consulting'],
    latitude: -37.8140,
    longitude: 144.9633,
    companyType: 'consultant',
    phoneNumber: '+61 3 9876 5432',
  },
  {
    id: '3',
    name: 'Global Manufacturing Co',
    address: '789 Bourke Street, Melbourne, VIC 3000',
    verificationStatus: 'verified',
    verificationDate: '2024-12-15',
    keySectors: ['Manufacturer', 'Supplier'],
    latitude: -37.8125,
    longitude: 144.9635,
    companyType: 'manufacturer',
    email: 'contact@globalmanufacturing.com',
  },
  {
    id: '4',
    name: 'Tech Solutions Pty Ltd',
    address: '321 Swanston Street, Melbourne, VIC 3000',
    verificationStatus: 'verified',
    verificationDate: '2025-01-02',
    keySectors: ['Service Provider', 'Technology'],
    latitude: -37.8150,
    longitude: 144.9640,
    companyType: 'service',
    website: 'www.techsolutions.com.au',
  },
  {
    id: '5',
    name: 'BuildRight Construction',
    address: '555 Elizabeth Street, Melbourne, VIC 3000',
    verificationStatus: 'unverified',
    keySectors: ['Construction', 'Supplier'],
    latitude: -37.8110,
    longitude: 144.9620,
    companyType: 'supplier',
  },
];

// Generate additional mock companies for testing
export const generateMockCompanies = (count: number): Company[] => {
  const sectors = ['Construction', 'Manufacturing', 'Engineering', 'Technology', 'Consulting', 'Retail'];
  const streets = ['King Street', 'Queen Street', 'Flinders Street', 'Spencer Street', 'William Street'];
  const types: Array<'supplier' | 'manufacturer' | 'service' | 'consultant'> = ['supplier', 'manufacturer', 'service', 'consultant'];
  
  const additionalCompanies: Company[] = [];
  
  for (let i = 6; i <= count + 5; i++) {
    additionalCompanies.push({
      id: i.toString(),
      name: `Company ${i}`,
      address: `${i * 10} ${streets[i % streets.length]}, Melbourne, VIC 3000`,
      verificationStatus: i % 2 === 0 ? 'verified' : 'unverified',
      keySectors: [sectors[i % sectors.length], sectors[(i + 1) % sectors.length]],
      latitude: -37.8136 + (Math.random() - 0.5) * 0.05,
      longitude: 144.9631 + (Math.random() - 0.5) * 0.05,
      companyType: types[i % types.length],
    });
  }
  
  return [...mockCompanies, ...additionalCompanies];
};
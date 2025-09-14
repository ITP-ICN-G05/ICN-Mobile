export interface Company {
  id: string;
  name: string;
  address: string;
  verificationStatus: 'verified' | 'unverified';
  verificationDate?: string;
  keySectors: string[];
  latitude: number;
  longitude: number;
  capabilities?: string[];
  companyType?: 'supplier' | 'manufacturer' | 'service' | 'consultant';
  phoneNumber?: string;
  email?: string;
  website?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'basic' | 'pro';
}

export interface SearchFilters {
  searchText: string;
  sectors: string[];
  companyTypes: string[];
  verificationStatus?: 'all' | 'verified' | 'unverified';
  distance?: number;
}
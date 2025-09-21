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
  
  // New fields for tier-based filtering
  companySize?: 'SME' | 'Medium' | 'Large' | 'Enterprise';
  certifications?: string[];
  ownershipType?: ('Female-owned' | 'First Nations-owned' | 'Veteran-owned' | 'Minority-owned')[];
  socialEnterprise?: boolean;
  australianDisabilityEnterprise?: boolean;
  revenue?: number;
  employeeCount?: number;
  localContentPercentage?: number;
  abn?: string;
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
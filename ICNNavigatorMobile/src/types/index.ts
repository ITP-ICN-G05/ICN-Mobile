export interface Company {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  website?: string;
  email?: string;
  phone?: string;
  employees?: number;
  revenue?: number;
  foundedYear?: number;
  tags?: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  tier: 'basic' | 'premium' | 'enterprise';
  createdAt: string;
}

export interface SearchFilters {
  industry?: string[];
  location?: {
    city?: string;
    state?: string;
    country?: string;
    radius?: number;
  };
  employees?: {
    min?: number;
    max?: number;
  };
  revenue?: {
    min?: number;
    max?: number;
  };
  foundedYear?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface CompanyState {
  companies: Company[];
  filteredCompanies: Company[];
  selectedCompany: Company | null;
  searchQuery: string;
  filters: SearchFilters;
  isLoading: boolean;
  error: string | null;
}

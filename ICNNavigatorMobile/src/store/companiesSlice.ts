import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Company, ICNItem, SearchFilters, ApiResponse } from '../types';
import ICNDataService from '../services/icnDataService';

interface CompaniesState {
  // All companies data
  allCompanies: Company[];
  
  // Search results
  searchResults: Company[];
  filteredCompanies: Company[];
  
  // Current view
  selectedCompany: Company | null;
  nearbyCompanies: Company[];
  
  // UI State
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  
  // Metadata
  totalCount: number;
  lastUpdated: string | null;
  currentPage: number;
  hasMore: boolean;
  
  // Sectors and capabilities from ICN data
  availableSectors: string[];
  availableCapabilities: string[];
  availableCompanyTypes: string[];
}

const initialState: CompaniesState = {
  allCompanies: [],
  searchResults: [],
  filteredCompanies: [],
  selectedCompany: null,
  nearbyCompanies: [],
  isLoading: false,
  isSearching: false,
  error: null,
  totalCount: 0,
  lastUpdated: null,
  currentPage: 1,
  hasMore: true,
  availableSectors: [],
  availableCapabilities: [],
  availableCompanyTypes: [],
};

// Async thunks
export const loadICNData = createAsyncThunk(
  'companies/loadICNData',
  async () => {
    try {
      // Load from ICN data service
      const icnData = await ICNDataService.loadData();
      const companies = ICNDataService.getCompanies();
      
      // Cache to AsyncStorage
      await AsyncStorage.setItem('@icn_companies', JSON.stringify(companies));
      await AsyncStorage.setItem('@icn_last_updated', new Date().toISOString());
      
      return companies;
    } catch (error) {
      throw error;
    }
  }
);

export const searchCompanies = createAsyncThunk(
  'companies/search',
  async (filters: SearchFilters) => {
    try {
      // Simulate API call - replace with actual API
      const response = await fetch('https://api.icnvictoria.com/companies/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: ApiResponse<Company[]> = await response.json();
      return data.data || [];
    } catch (error) {
      // Fallback to local search
      const cachedCompanies = await AsyncStorage.getItem('@icn_companies');
      if (cachedCompanies) {
        const companies: Company[] = JSON.parse(cachedCompanies);
        // Apply local filtering
        return companies.filter(company => {
          if (filters.searchText && !company.name.toLowerCase().includes(filters.searchText.toLowerCase())) {
            return false;
          }
          if (filters.sectors?.length && !filters.sectors.some(s => company.keySectors.includes(s))) {
            return false;
          }
          return true;
        });
      }
      throw error;
    }
  }
);

export const fetchNearbyCompanies = createAsyncThunk(
  'companies/fetchNearby',
  async ({ latitude, longitude, radius = 10 }: { latitude: number; longitude: number; radius?: number }) => {
    try {
      const response = await fetch(`https://api.icnvictoria.com/companies/nearby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude, radius }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch nearby companies');
      
      const data: ApiResponse<Company[]> = await response.json();
      return data.data || [];
    } catch (error) {
      throw error;
    }
  }
);

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.allCompanies = action.payload;
      state.totalCount = action.payload.length;
      state.lastUpdated = new Date().toISOString();
      
      // Extract unique sectors and capabilities
      const sectors = new Set<string>();
      const capabilities = new Set<string>();
      const companyTypes = new Set<string>();
      
      action.payload.forEach(company => {
        company.keySectors?.forEach(s => sectors.add(s));
        company.capabilities?.forEach(c => capabilities.add(c));
        if (company.companyType) companyTypes.add(company.companyType);
      });
      
      state.availableSectors = Array.from(sectors).sort();
      state.availableCapabilities = Array.from(capabilities).sort();
      state.availableCompanyTypes = Array.from(companyTypes).sort();
    },
    
    setSelectedCompany: (state, action: PayloadAction<Company | null>) => {
      state.selectedCompany = action.payload;
    },
    
    updateCompany: (state, action: PayloadAction<Company>) => {
      const index = state.allCompanies.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.allCompanies[index] = action.payload;
      }
      if (state.selectedCompany?.id === action.payload.id) {
        state.selectedCompany = action.payload;
      }
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.filteredCompanies = [];
      state.currentPage = 1;
      state.hasMore = true;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  
  extraReducers: (builder) => {
    // Load ICN Data
    builder
      .addCase(loadICNData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadICNData.fulfilled, (state, action) => {
        state.allCompanies = action.payload;
        state.totalCount = action.payload.length;
        state.lastUpdated = new Date().toISOString();
        state.isLoading = false;
      })
      .addCase(loadICNData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load companies';
      });
    
    // Search Companies
    builder
      .addCase(searchCompanies.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchCompanies.fulfilled, (state, action) => {
        state.searchResults = action.payload;
        state.filteredCompanies = action.payload;
        state.isSearching = false;
      })
      .addCase(searchCompanies.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.error.message || 'Search failed';
      });
    
    // Nearby Companies
    builder
      .addCase(fetchNearbyCompanies.fulfilled, (state, action) => {
        state.nearbyCompanies = action.payload;
      });
  },
});

export const {
  setCompanies,
  setSelectedCompany,
  updateCompany,
  clearSearchResults,
  setError,
} = companiesSlice.actions;

export default companiesSlice.reducer;
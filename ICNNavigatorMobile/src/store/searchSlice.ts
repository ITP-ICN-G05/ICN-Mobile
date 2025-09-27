import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SearchFilters, EnhancedFilterOptions } from '../types';

interface SearchState {
  // Current search
  currentFilters: SearchFilters;
  searchHistory: Array<{
    id: string;
    query: string;
    filters: SearchFilters;
    timestamp: string;
    resultCount: number;
  }>;
  
  // Filter modal state
  activeFilters: EnhancedFilterOptions;
  tempFilters: EnhancedFilterOptions | null;
  
  // UI State
  isFilterModalOpen: boolean;
  searchMode: 'map' | 'list';
  sortBy: 'relevance' | 'distance' | 'name' | 'rating' | 'verified';
  
  // Suggestions
  recentSearches: string[];
  suggestedSearches: string[];
}

const defaultFilters: SearchFilters = {
  searchText: '',
  sectors: [],
  companyTypes: [],
  verificationStatus: 'all',
  distance: 10,
  sortBy: 'relevance',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
};

const initialState: SearchState = {
  currentFilters: defaultFilters,
  searchHistory: [],
  activeFilters: {
    capabilities: [],
    distance: '10km',
    sectors: [],
  },
  tempFilters: null,
  isFilterModalOpen: false,
  searchMode: 'list',
  sortBy: 'relevance',
  recentSearches: [],
  suggestedSearches: [],
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    updateFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.currentFilters = { ...state.currentFilters, ...action.payload };
    },
    
    resetFilters: (state) => {
      state.currentFilters = defaultFilters;
      state.activeFilters = {
        capabilities: [],
        distance: '10km',
        sectors: [],
      };
    },
    
    setSearchText: (state, action: PayloadAction<string>) => {
      state.currentFilters.searchText = action.payload;
    },
    
    toggleSector: (state, action: PayloadAction<string>) => {
      const sectors = state.currentFilters.sectors;
      const index = sectors.indexOf(action.payload);
      if (index > -1) {
        sectors.splice(index, 1);
      } else {
        sectors.push(action.payload);
      }
    },
    
    setSearchMode: (state, action: PayloadAction<'map' | 'list'>) => {
      state.searchMode = action.payload;
    },
    
    setSortBy: (state, action: PayloadAction<typeof state.sortBy>) => {
      state.sortBy = action.payload;
      state.currentFilters.sortBy = action.payload;
    },
    
    addToSearchHistory: (state, action: PayloadAction<{
      query: string;
      filters: SearchFilters;
      resultCount: number;
    }>) => {
      state.searchHistory.unshift({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      });
      
      // Keep only last 50 searches
      if (state.searchHistory.length > 50) {
        state.searchHistory = state.searchHistory.slice(0, 50);
      }
      
      // Update recent searches
      if (action.payload.query && !state.recentSearches.includes(action.payload.query)) {
        state.recentSearches.unshift(action.payload.query);
        state.recentSearches = state.recentSearches.slice(0, 10);
      }
    },
    
    setFilterModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isFilterModalOpen = action.payload;
      if (!action.payload && state.tempFilters) {
        state.tempFilters = null;
      }
    },
    
    updateEnhancedFilters: (state, action: PayloadAction<Partial<EnhancedFilterOptions>>) => {
      state.activeFilters = { ...state.activeFilters, ...action.payload };
    },
  },
});

export const {
  updateFilters,
  resetFilters,
  setSearchText,
  toggleSector,
  setSearchMode,
  setSortBy,
  addToSearchHistory,
  setFilterModalOpen,
  updateEnhancedFilters,
} = searchSlice.actions;

export default searchSlice.reducer;
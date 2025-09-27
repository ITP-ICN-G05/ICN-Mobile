import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedCompany, SavedFolder, SavedSearch, Company } from '../types';

interface PortfolioState {
  savedCompanies: SavedCompany[];
  folders: SavedFolder[];
  savedSearches: SavedSearch[];
  
  // UI State
  selectedFolderId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Stats
  totalSaved: number;
  recentlySaved: SavedCompany[];
}

const initialState: PortfolioState = {
  savedCompanies: [],
  folders: [],
  savedSearches: [],
  selectedFolderId: null,
  isLoading: false,
  error: null,
  totalSaved: 0,
  recentlySaved: [],
};

// Async thunks
export const loadPortfolio = createAsyncThunk(
  'portfolio/load',
  async (userId: string) => {
    try {
      // Load from local storage first
      const [companies, folders, searches] = await Promise.all([
        AsyncStorage.getItem(`@saved_companies_${userId}`),
        AsyncStorage.getItem(`@saved_folders_${userId}`),
        AsyncStorage.getItem(`@saved_searches_${userId}`),
      ]);
      
      return {
        companies: companies ? JSON.parse(companies) : [],
        folders: folders ? JSON.parse(folders) : [],
        searches: searches ? JSON.parse(searches) : [],
      };
    } catch (error) {
      throw error;
    }
  }
);

export const saveCompany = createAsyncThunk(
  'portfolio/saveCompany',
  async ({ company, userId, folderId, notes }: {
    company: Company;
    userId: string;
    folderId?: string;
    notes?: string;
  }) => {
    const savedCompany: SavedCompany = {
      id: `saved_${Date.now()}`,
      companyId: company.id,
      company,
      userId,
      folderId,
      notes,
      savedDate: new Date().toISOString(),
      isPinned: false,
    };
    
    // Save to backend
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (token) {
        await fetch('https://api.icnvictoria.com/portfolio/companies', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(savedCompany),
        });
      }
    } catch (error) {
      console.warn('Failed to sync with backend');
    }
    
    return savedCompany;
  }
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    addSavedCompany: (state, action: PayloadAction<SavedCompany>) => {
      state.savedCompanies.push(action.payload);
      state.totalSaved += 1;
      state.recentlySaved = [action.payload, ...state.recentlySaved].slice(0, 5);
    },
    
    removeSavedCompany: (state, action: PayloadAction<string>) => {
      state.savedCompanies = state.savedCompanies.filter(sc => sc.id !== action.payload);
      state.totalSaved = Math.max(0, state.totalSaved - 1);
    },
    
    toggleCompanyPin: (state, action: PayloadAction<string>) => {
      const company = state.savedCompanies.find(sc => sc.id === action.payload);
      if (company) {
        company.isPinned = !company.isPinned;
      }
    },
    
    createFolder: (state, action: PayloadAction<Omit<SavedFolder, 'id' | 'itemCount' | 'createdDate' | 'updatedDate'>>) => {
      const folder: SavedFolder = {
        ...action.payload,
        id: `folder_${Date.now()}`,
        itemCount: 0,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      };
      state.folders.push(folder);
    },
    
    deleteFolder: (state, action: PayloadAction<string>) => {
      state.folders = state.folders.filter(f => f.id !== action.payload);
      // Move companies from deleted folder to default
      state.savedCompanies.forEach(sc => {
        if (sc.folderId === action.payload) {
          sc.folderId = undefined;
        }
      });
    },
    
    saveSavedSearch: (state, action: PayloadAction<SavedSearch>) => {
      state.savedSearches.push(action.payload);
    },
    
    deleteSavedSearch: (state, action: PayloadAction<string>) => {
      state.savedSearches = state.savedSearches.filter(s => s.id !== action.payload);
    },
    
    selectFolder: (state, action: PayloadAction<string | null>) => {
      state.selectedFolderId = action.payload;
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(loadPortfolio.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadPortfolio.fulfilled, (state, action) => {
        state.savedCompanies = action.payload.companies;
        state.folders = action.payload.folders;
        state.savedSearches = action.payload.searches;
        state.totalSaved = action.payload.companies.length;
        state.isLoading = false;
      })
      .addCase(loadPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load portfolio';
      });
    
    builder
      .addCase(saveCompany.fulfilled, (state, action) => {
        state.savedCompanies.push(action.payload);
        state.totalSaved += 1;
        state.recentlySaved = [action.payload, ...state.recentlySaved].slice(0, 5);
      });
  },
});

export const {
  addSavedCompany,
  removeSavedCompany,
  toggleCompanyPin,
  createFolder,
  deleteFolder,
  saveSavedSearch,
  deleteSavedSearch,
  selectFolder,
} = portfolioSlice.actions;

export default portfolioSlice.reducer;
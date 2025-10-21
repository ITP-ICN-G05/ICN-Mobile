import { Company } from '../../../types';
import { EnhancedFilterOptions } from '../../../components/common/EnhancedFilterModal';

export interface UIStats {
  total: number;
  verified: number;
  saved: number;
}

export interface CompaniesScreenState {
  searchText: string;
  bookmarkedIds: string[];
  refreshing: boolean;
  filterModalVisible: boolean;
  viewMode: 'list' | 'grid';
  sortBy: 'name' | 'verified' | 'recent';
  showSortOptions: boolean;
  filters: EnhancedFilterOptions;
}

export interface FilterOptions {
  sectors: string[];
  states: string[];
  capabilities: string[];
  capabilityTypes: string[];
  cities: string[];
}
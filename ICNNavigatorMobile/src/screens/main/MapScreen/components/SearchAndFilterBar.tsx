import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import SearchBarWithDropdown from '@/components/common/SearchBarWithDropdown';
import { Colors } from '@/constants/colors';
import { Company } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  insets: any;
  searchText: string;
  onSearchChange: (text: string) => void;
  onFilterPress: () => void;
  filteredCount: number;
  totalCount: number;
  hasAnyFilters: boolean;
  onClearFilters: () => void;
  selectedCompany: Company | null;
  isFromDropdownSelection: boolean;
}

export default function SearchAndFilterBar({
  insets,
  searchText,
  onSearchChange,
  onFilterPress,
  filteredCount,
  totalCount,
  hasAnyFilters,
  onClearFilters,
  selectedCompany,
  isFromDropdownSelection
}: Props) {
  const getClearButtonText = () => {
    const hasSearch = searchText.trim().length > 0;
    if (hasSearch && hasAnyFilters) return 'Clear All';
    if (hasSearch) return 'Clear Search';
    return 'Clear Filters';
  };

  const shouldShowFilterBar = hasAnyFilters && !isFromDropdownSelection;

  return (
    <>
      <View style={[styles.searchOverlay, { top: insets.top + 10 }]}>
        <SearchBarWithDropdown
          value={searchText}
          onChangeText={onSearchChange}
          onSelectCompany={() => {}} // Handled in parent
          onFilter={onFilterPress}
          companies={[]} // Passed through context
          placeholder="Search companies, locations..."
        />
      </View>

      {shouldShowFilterBar && (
        <View style={[styles.filterBar, { top: insets.top + 80 }]}>
          <View style={styles.filterInfo}>
            <Text style={styles.filterText}>
              {filteredCount} of {totalCount} companies
            </Text>
          </View>
          <TouchableOpacity onPress={onClearFilters}>
            <Text style={styles.clearText}>{getClearButtonText()}</Text>
          </TouchableOpacity>
        </View>
      )}

      {filteredCount === 0 && totalCount > 0 && (
        <View style={styles.noResultsOverlay}>
          <Ionicons name="search" size={48} color={Colors.black50} />
          <Text style={styles.noResultsText}>No companies found</Text>
          <Text style={styles.noResultsSubText}>
            Try adjusting your filters or search
          </Text>
          <TouchableOpacity style={styles.clearButton} onPress={onClearFilters}>
            <Text style={styles.clearButtonText}>{getClearButtonText()}</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  searchOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000
  },
  filterBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  filterText: {
    fontSize: 14,
    color: Colors.text
  },
  clearText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600'
  },
  noResultsOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16
  },
  noResultsSubText: {
    fontSize: 14,
    color: Colors.black50,
    marginTop: 8
  },
  clearButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 20
  },
  clearButtonText: {
    color: Colors.white,
    fontWeight: '600'
  }
});
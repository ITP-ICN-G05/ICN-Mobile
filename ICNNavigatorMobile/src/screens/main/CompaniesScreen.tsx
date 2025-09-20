import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SearchBar from '../../components/common/SearchBar';
import CompanyCard from '../../components/common/CompanyCard';
import FilterModal, { FilterOptions } from '../../components/common/FilterModal';
import { Colors, Spacing } from '../../constants/colors';
import { Company } from '../../types';
import { mockCompanies, generateMockCompanies } from '../../data/mockCompanies';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CompaniesScreen() {
  // Navigation hook
  const navigation = useNavigation<any>();
  
  // State management
  const [searchText, setSearchText] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'verified' | 'recent'>('name');
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // Get extended mock data
  const [allCompanies] = useState(() => generateMockCompanies(20));
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    capabilities: [],
    distance: 'All',
    verificationStatus: 'All',
  });

  // Filter and sort companies
  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = [...allCompanies];

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchText.toLowerCase()) ||
        company.address.toLowerCase().includes(searchText.toLowerCase()) ||
        company.keySectors.some(sector => 
          sector.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    // Apply capability filter (multi-select)
    if (filters.capabilities.length > 0) {
      filtered = filtered.filter(company =>
        filters.capabilities.some(capability =>
          company.keySectors.includes(capability) ||
          company.keySectors.some(sector =>
            sector.toLowerCase().includes(capability.toLowerCase())
          )
        )
      );
    }

    // Apply verification filter
    if (filters.verificationStatus !== 'All') {
      const statusToCheck = filters.verificationStatus.toLowerCase();
      filtered = filtered.filter(company =>
        company.verificationStatus === statusToCheck
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'verified':
        filtered.sort((a, b) => {
          if (a.verificationStatus === 'verified' && b.verificationStatus !== 'verified') return -1;
          if (a.verificationStatus !== 'verified' && b.verificationStatus === 'verified') return 1;
          return a.name.localeCompare(b.name);
        });
        break;
      case 'recent':
        // Sort by verification date or ID (simulating recent activity)
        filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
    }

    return filtered;
  }, [searchText, filters, sortBy, allCompanies]);

  // Bookmarked companies section
  const bookmarkedCompanies = useMemo(() => {
    return allCompanies.filter(company => bookmarkedIds.includes(company.id));
  }, [bookmarkedIds, allCompanies]);

  // Check if filters are active
  const hasActiveFilters = () => {
    return filters.capabilities.length > 0 || 
           filters.distance !== 'All' || 
           filters.verificationStatus !== 'All';
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.capabilities.length > 0) count++;
    if (filters.distance !== 'All') count++;
    if (filters.verificationStatus !== 'All') count++;
    return count;
  };

  // Toggle bookmark
  const toggleBookmark = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBookmarkedIds(prev =>
      prev.includes(id) 
        ? prev.filter(bookId => bookId !== id)
        : [...prev, id]
    );
  };

  // Handle company press
  const handleCompanyPress = (company: Company) => {
    // Navigate to company detail screen
    navigation.navigate('CompanyDetail', { company });
  };

  // Handle refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  // Apply filters
  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      capabilities: [],
      distance: 'All',
      verificationStatus: 'All',
    });
  };

  // Toggle sort options
  const toggleSortOptions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowSortOptions(!showSortOptions);
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredAndSortedCompanies.length}</Text>
          <Text style={styles.statLabel}>Companies</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {filteredAndSortedCompanies.filter(c => c.verificationStatus === 'verified').length}
          </Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{bookmarkedIds.length}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      {/* Sort and View Options */}
      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.sortButton} onPress={toggleSortOptions}>
          <Ionicons name="swap-vertical" size={18} color={Colors.text} />
          <Text style={styles.sortButtonText}>
            Sort: {sortBy === 'name' ? 'Name' : sortBy === 'verified' ? 'Verified' : 'Recent'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.viewToggle} 
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
        >
          <Ionicons 
            name={viewMode === 'list' ? 'grid' : 'list'} 
            size={20} 
            color={Colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Sort Options Dropdown */}
      {showSortOptions && (
        <View style={styles.sortOptions}>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'name' && styles.sortOptionActive]}
            onPress={() => { setSortBy('name'); setShowSortOptions(false); }}
          >
            <Text style={[styles.sortOptionText, sortBy === 'name' && styles.sortOptionTextActive]}>
              By Name (A-Z)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'verified' && styles.sortOptionActive]}
            onPress={() => { setSortBy('verified'); setShowSortOptions(false); }}
          >
            <Text style={[styles.sortOptionText, sortBy === 'verified' && styles.sortOptionTextActive]}>
              Verified First
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'recent' && styles.sortOptionActive]}
            onPress={() => { setSortBy('recent'); setShowSortOptions(false); }}
          >
            <Text style={[styles.sortOptionText, sortBy === 'recent' && styles.sortOptionTextActive]}>
              Most Recent
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Filters Bar */}
      {hasActiveFilters() && (
        <View style={styles.activeFiltersBar}>
          <View style={styles.activeFiltersInfo}>
            <Text style={styles.activeFiltersText}>
              {getActiveFilterCount()} filter{getActiveFilterCount() > 1 ? 's' : ''} active
            </Text>
            {filters.capabilities.length > 0 && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {filters.capabilities.length} capabilities
                </Text>
              </View>
            )}
            {filters.verificationStatus !== 'All' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{filters.verificationStatus}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bookmarked Section */}
      {bookmarkedCompanies.length > 0 && (
        <View style={styles.bookmarkedSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bookmark" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Saved Companies</Text>
            <Text style={styles.sectionCount}>({bookmarkedCompanies.length})</Text>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={bookmarkedCompanies}
            keyExtractor={(item) => `bookmarked-${item.id}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.bookmarkedCard}
                onPress={() => handleCompanyPress(item)}
              >
                <View style={styles.bookmarkedAvatar}>
                  <Text style={styles.bookmarkedAvatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.bookmarkedName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.verificationStatus === 'verified' && (
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.bookmarkedList}
          />
        </View>
      )}
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business-outline" size={64} color={Colors.black50} />
      <Text style={styles.emptyStateTitle}>No Companies Found</Text>
      <Text style={styles.emptyStateText}>
        {searchText ? 
          `No results for "${searchText}"` : 
          'Try adjusting your filters'}
      </Text>
      {hasActiveFilters() && (
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render grid item (alternative view)
  const renderGridItem = ({ item }: { item: Company }) => (
    <TouchableOpacity 
      style={styles.gridCard}
      onPress={() => handleCompanyPress(item)}
      activeOpacity={0.9}
    >
      <View style={styles.gridAvatar}>
        <Text style={styles.gridAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.gridAddress} numberOfLines={1}>{item.address}</Text>
      {item.verificationStatus === 'verified' && (
        <View style={styles.gridVerified}>
          <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
        </View>
      )}
      <TouchableOpacity 
        style={styles.gridBookmark}
        onPress={() => toggleBookmark(item.id)}
      >
        <Ionicons 
          name={bookmarkedIds.includes(item.id) ? 'bookmark' : 'bookmark-outline'} 
          size={16} 
          color={Colors.primary}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search companies..."
        onFilter={() => setFilterModalVisible(true)}
      />
      
      <FlatList
        data={filteredAndSortedCompanies}
        keyExtractor={(item) => item.id}
        renderItem={viewMode === 'list' ? 
          ({ item }) => (
            <CompanyCard
              company={item}
              onPress={() => handleCompanyPress(item)}
              onBookmark={() => toggleBookmark(item.id)}
              isBookmarked={bookmarkedIds.includes(item.id)}
            />
          ) : 
          renderGridItem
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          filteredAndSortedCompanies.length === 0 && styles.emptyListContent
        ]}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when changing columns
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: Colors.white,
    marginBottom: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.black50,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.black20,
    marginVertical: 8,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  viewToggle: {
    padding: 4,
  },
  sortOptions: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  sortOptionActive: {
    backgroundColor: Colors.orange[400],
  },
  sortOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  sortOptionTextActive: {
    fontWeight: '600',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.orange[400],
  },
  activeFiltersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  activeFiltersText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  filterChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.text,
  },
  clearFiltersText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  bookmarkedSection: {
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionCount: {
    fontSize: 14,
    color: Colors.black50,
  },
  bookmarkedList: {
    paddingHorizontal: 16,
  },
  bookmarkedCard: {
    backgroundColor: Colors.orange[400],
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  bookmarkedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookmarkedAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  bookmarkedName: {
    fontSize: 12,
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.black50,
    textAlign: 'center',
    marginBottom: 24,
  },
  clearButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  clearButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  // Grid view styles
  gridCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    margin: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.orange[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
    height: 34,
  },
  gridAddress: {
    fontSize: 11,
    color: Colors.black50,
    textAlign: 'center',
    marginBottom: 8,
  },
  gridVerified: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 2,
  },
  gridBookmark: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
});
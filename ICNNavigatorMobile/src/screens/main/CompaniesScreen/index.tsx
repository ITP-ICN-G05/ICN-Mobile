import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SearchBar from '../../../components/common/SearchBar';
import CompanyCard from '../../../components/common/CompanyCard';
import EnhancedFilterModal from '../../../components/common/EnhancedFilterModal';
import { useCompanies } from './hooks/useCompanies';
import { Header } from './components/Header';
import { CompanyGridItem } from './components/CompanyGridItem';
import { EmptyState } from './components/EmptyState';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { styles } from './styles';
import { Colors } from '../../../constants/colors';

export default function CompaniesScreen() {
  const {
    // State
    searchText,
    filterModalVisible,
    viewMode,
    sortBy,
    showSortOptions,
    filters,
    bookmarkedIds,
    refreshing,
    icnLoading,
    icnError,
    filteredAndSortedCompanies,
    bookmarkedCompanies,
    uiStats,
    currentTier,
    features,
    modalFilterOptions,
    
    // Actions
    setSearchText,
    setFilterModalVisible,
    setViewMode,
    setSortBy,
    setShowSortOptions,
    toggleBookmark,
    handleCompanyPress,
    onRefresh,
    handleApplyFilters,
    clearFilters,
    handleNavigateToPayment,
    handleExport,
    
    // Helpers
    hasActiveFilters,
    getActiveFilterCount,
    getFilterBadges,
    getTierColor,
    getTierIcon
  } = useCompanies();

  // Render loading state
  if (icnLoading) {
    return <LoadingState />;
  }

  // Render error state
  if (icnError) {
    return (
      <ErrorState 
        error={icnError} 
        onRetry={onRefresh}
      />
    );
  }

  const renderHeader = () => (
    <Header
      currentTier={currentTier}
      uiStats={uiStats}
      sortBy={sortBy}
      showSortOptions={showSortOptions}
      viewMode={viewMode}
      hasActiveFilters={hasActiveFilters}
      activeFilterCount={getActiveFilterCount()}
      filterBadges={getFilterBadges()}
      bookmarkedCompanies={bookmarkedCompanies}
      onToggleSortOptions={() => setShowSortOptions(!showSortOptions)}
      onSetSortBy={setSortBy}
      onToggleViewMode={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
      onClearFilters={clearFilters}
      onNavigateToPayment={handleNavigateToPayment}
      onCompanyPress={handleCompanyPress}
      getTierColor={getTierColor}
      getTierIcon={getTierIcon}
    />
  );

  const renderEmptyState = () => (
    <EmptyState
      searchText={searchText}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
    />
  );

  const renderGridItem = ({ item }: { item: any }) => (
    <CompanyGridItem
      company={item}
      isBookmarked={bookmarkedIds.includes(item.id)}
      onPress={handleCompanyPress}
      onBookmark={toggleBookmark}
    />
  );

  const renderListItem = ({ item }: { item: any }) => (
    <CompanyCard
      company={item}
      onPress={() => handleCompanyPress(item)}
      onBookmark={() => toggleBookmark(item.id)}
      isBookmarked={bookmarkedIds.includes(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search companies, capabilities, locations..."
        onFilter={() => setFilterModalVisible(true)}
      />
      
      <FlatList
        data={filteredAndSortedCompanies}
        keyExtractor={(item) => item.id}
        renderItem={viewMode === 'list' ? renderListItem : renderGridItem}
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
      
      <EnhancedFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
        onNavigateToPayment={handleNavigateToPayment}
        filterOptions={modalFilterOptions}
      />
    </SafeAreaView>
  );
}
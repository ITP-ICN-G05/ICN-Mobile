import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { styles } from '../styles';
import { SortOptions } from './SortOptions';
import { ActiveFiltersBar } from './ActiveFiltersBar';
import { BookmarkedSection } from './BookmarkedSection';

interface HeaderProps {
  currentTier: string;
  uiStats: {
    total: number;
    verified: number;
    saved: number;
  };
  sortBy: 'name' | 'verified' | 'recent';
  showSortOptions: boolean;
  viewMode: 'list' | 'grid';
  hasActiveFilters: boolean;
  activeFilterCount: number;
  filterBadges: string[];
  bookmarkedCompanies: any[];
  onToggleSortOptions: () => void;
  onSetSortBy: (sort: 'name' | 'verified' | 'recent') => void;
  onToggleViewMode: () => void;
  onClearFilters: () => void;
  onNavigateToPayment: () => void;
  onCompanyPress: (company: any) => void;
  getTierColor: () => string;
  getTierIcon: () => string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTier,
  uiStats,
  sortBy,
  showSortOptions,
  viewMode,
  hasActiveFilters,
  activeFilterCount,
  filterBadges,
  bookmarkedCompanies,
  onToggleSortOptions,
  onSetSortBy,
  onToggleViewMode,
  onClearFilters,
  onNavigateToPayment,
  onCompanyPress,
  getTierColor,
  getTierIcon,
}) => {
  return (
    <View style={styles.header}>
      {/* Tier Indicator */}
      <View style={styles.tierBar}>
        <View style={[styles.tierBadge, { backgroundColor: getTierColor() }]}>
          <Ionicons name={getTierIcon()} size={16} color={Colors.white} />
          <Text style={styles.tierBarText}>
            {currentTier.toUpperCase()} TIER
          </Text>
        </View>
        {currentTier !== 'premium' && (
          <TouchableOpacity onPress={onNavigateToPayment}>
            <Text style={styles.upgradeLink}>Upgrade →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Bar with UI Statistics */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{uiStats.total}</Text>
          <Text style={styles.statLabel}>Companies</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{uiStats.verified}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{uiStats.saved}</Text>
          <Text style={styles.statLabel}>
            Saved {currentTier === 'free' && '(10 max)'}
          </Text>
        </View>
      </View>

      {/* Sort and View Options */}
      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.sortButton} onPress={onToggleSortOptions}>
          <Ionicons name="swap-vertical" size={18} color={Colors.text} />
          <Text style={styles.sortButtonText}>
            Sort: {sortBy === 'name' ? 'Name' : sortBy === 'verified' ? 'Verified' : 'Recent'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.viewToggle} 
          onPress={onToggleViewMode}
        >
          <Ionicons 
            name={viewMode === 'list' ? 'grid' : 'list'} 
            size={20} 
            color={Colors.black50} 
          />
        </TouchableOpacity>
      </View>

      {/* Sort Options Dropdown */}
      {showSortOptions && (
        <SortOptions 
          sortBy={sortBy}
          onSetSortBy={onSetSortBy}
        />
      )}

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <ActiveFiltersBar
          activeFilterCount={activeFilterCount}
          filterBadges={filterBadges}
          onClearFilters={onClearFilters}
        />
      )}

      {/* Bookmarked Section */}
      {bookmarkedCompanies.length > 0 && (
        <BookmarkedSection
          bookmarkedCompanies={bookmarkedCompanies}
          onCompanyPress={onCompanyPress}
        />
      )}
    </View>
  );
};
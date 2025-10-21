import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from '../styles';

interface ActiveFiltersBarProps {
  activeFilterCount: number;
  filterBadges: string[];
  onClearFilters: () => void;
}

export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  activeFilterCount,
  filterBadges,
  onClearFilters,
}) => {
  return (
    <View style={styles.activeFiltersBar}>
      <View style={styles.activeFiltersInfo}>
        <Text style={styles.activeFiltersText}>
          {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterBadgesScroll}
        >
          {filterBadges.map((badge, index) => (
            <View key={index} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{badge}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      <TouchableOpacity onPress={onClearFilters}>
        <Text style={styles.clearFiltersText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
};
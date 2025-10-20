import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Colors } from '../../../../constants/colors';

interface EmptyStateProps {
  searchText: string;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  searchText,
  hasActiveFilters,
  onClearFilters,
}) => {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="business-outline" size={64} color={Colors.black50} />
      <Text style={styles.emptyStateTitle}>No Companies Found</Text>
      <Text style={styles.emptyStateText}>
        {searchText ? 
          `No results for "${searchText}"` : 
          'Try adjusting your filters'}
      </Text>
      {hasActiveFilters && (
        <TouchableOpacity style={styles.clearButton} onPress={onClearFilters}>
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
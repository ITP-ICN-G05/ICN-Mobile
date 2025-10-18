import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';
import { Colors } from '../../../../constants/colors';

interface SortOptionsProps {
  sortBy: 'name' | 'verified' | 'recent';
  onSetSortBy: (sort: 'name' | 'verified' | 'recent') => void;
}

export const SortOptions: React.FC<SortOptionsProps> = ({
  sortBy,
  onSetSortBy,
}) => {
  const options = [
    { key: 'name' as const, label: 'By Name (A-Z)' },
    { key: 'verified' as const, label: 'Verified First' },
    { key: 'recent' as const, label: 'Most Recent' },
  ];

  return (
    <View style={styles.sortOptions}>
      {options.map((option) => (
        <TouchableOpacity 
          key={option.key}
          style={[styles.sortOption, sortBy === option.key && styles.sortOptionActive]}
          onPress={() => onSetSortBy(option.key)}
        >
          <Text style={[
            styles.sortOptionText, 
            sortBy === option.key && styles.sortOptionTextActive
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
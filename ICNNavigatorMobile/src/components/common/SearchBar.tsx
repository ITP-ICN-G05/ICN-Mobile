import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilter?: () => void;
}

export default function SearchBar({ 
  value, 
  onChangeText, 
  placeholder = "Search...",
  onFilter 
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.black50} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.black50}
          testID="search-input"
          accessibilityLabel="Search input"
        />
      </View>
      {onFilter && (
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={onFilter}
          testID="filter-button"
          accessibilityLabel="Filter companies"
        >
          <Ionicons name="filter" size={24} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.orange[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
});
import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Local color definitions
const Colors = {
  white: '#FFFFFF',
  text: '#111111',
  black50: '#808080',
  black20: '#E0E0E0', // Border color
  primary: '#F99F1C',
  searchBg: '#FFFFFF', // Search bar background color changed to white
  orange200: '#FAB249',
};

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
        {onFilter && (
          <TouchableOpacity style={styles.filterButton} onPress={onFilter}>
            <Ionicons name="filter" size={20} color={Colors.black50} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.searchBg,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.black20,
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
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
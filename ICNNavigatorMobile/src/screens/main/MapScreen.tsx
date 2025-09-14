import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/common/SearchBar';
import { Colors, Spacing } from '../../constants/colors';

export default function MapScreen() {
  const [searchText, setSearchText] = useState('');

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search companies on map..."
        onFilter={() => console.log('Filter pressed')}
      />
      
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={80} color={Colors.black50} />
          <Text style={styles.placeholderText}>Map View</Text>
          <Text style={styles.subText}>Melbourne Region</Text>
          <Text style={styles.coordinates}>-37.8136, 144.9631</Text>
        </View>
        
        <TouchableOpacity style={styles.myLocationButton}>
          <Ionicons name="locate" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  placeholderText: {
    fontSize: 24,
    color: Colors.text,
    marginTop: Spacing.md,
    fontWeight: '600',
  },
  subText: {
    fontSize: 16,
    color: Colors.black50,
    marginTop: Spacing.xs,
  },
  coordinates: {
    fontSize: 14,
    color: Colors.black50,
    marginTop: Spacing.xs,
    fontFamily: 'monospace',
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});
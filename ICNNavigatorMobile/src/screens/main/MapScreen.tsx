import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/common/SearchBar';
import { Colors, Spacing } from '../../constants/colors';
import { Company } from '../../types';
import { mockCompanies } from '../../data/mockCompanies';

export default function MapScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const companies = mockCompanies;

  const CompanyMarkerItem = ({ company }: { company: Company }) => (
    <TouchableOpacity 
      style={styles.companyItem}
      onPress={() => setSelectedCompany(company)}
    >
      <View style={[
        styles.markerIcon,
        { backgroundColor: company.verificationStatus === 'verified' ? Colors.success : Colors.primary }
      ]}>
        <Ionicons name="location" size={16} color={Colors.white} />
      </View>
      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>{company.name}</Text>
        <Text style={styles.companyAddress}>{company.address}</Text>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.subText}>{companies.length} companies in area</Text>
        </View>
        
        <ScrollView style={styles.companiesList}>
          <Text style={styles.listTitle}>Companies in Area:</Text>
          {companies.map(company => (
            <CompanyMarkerItem key={company.id} company={company} />
          ))}
        </ScrollView>
        
        <TouchableOpacity style={styles.myLocationButton}>
          <Ionicons name="locate" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {selectedCompany && (
        <View style={styles.companyDetail}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedCompany(null)}
          >
            <Ionicons name="close" size={24} color={Colors.black50} />
          </TouchableOpacity>
          <Text style={styles.detailName}>{selectedCompany.name}</Text>
          <Text style={styles.detailAddress}>{selectedCompany.address}</Text>
          <View style={styles.sectorContainer}>
            {selectedCompany.keySectors.map((sector, index) => (
              <View key={index} style={styles.sectorChip}>
                <Text style={styles.sectorText}>{sector}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
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
    height: 200,
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
  companiesList: {
    flex: 1,
    padding: Spacing.md,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  markerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  companyAddress: {
    fontSize: 12,
    color: Colors.black50,
    marginTop: 2,
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    top: 220,
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
  companyDetail: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  detailName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  detailAddress: {
    fontSize: 14,
    color: Colors.black50,
    marginBottom: Spacing.md,
  },
  sectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sectorChip: {
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sectorText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
});
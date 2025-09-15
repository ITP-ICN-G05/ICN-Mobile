import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FilterDropdown from './FilterDropdown';
import { Colors, Spacing } from '../../constants/colors';

export interface FilterOptions {
  capabilities: string[];
  distance: string;
  verificationStatus: string;
}

const CAPABILITY_OPTIONS = [
  'Service Provider',
  'Item Supplier',
  'Manufacturer',
  'Retailer',
  'Consulting',
  'Engineering',
  'Technology',
  'Construction',
];

const DISTANCE_OPTIONS = [
  'within 500m',
  '1km',
  '5km',
  '10km',
  '25km',
  '50km',
];

const VERIFICATION_OPTIONS = [
  'Verified',
  'Unverified',
];

export default function FilterModal({ 
  visible, 
  onClose, 
  onApply,
  currentFilters 
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters?: FilterOptions;
}) {
  const [capabilities, setCapabilities] = useState<string[]>(
    currentFilters?.capabilities || []
  );
  const [distance, setDistance] = useState<string>(
    currentFilters?.distance || 'All'
  );
  const [verificationStatus, setVerificationStatus] = useState<string>(
    currentFilters?.verificationStatus || 'All'
  );

  const handleApplyAll = () => {
    onApply({
      capabilities: capabilities,
      distance: distance,
      verificationStatus: verificationStatus,
    });
    onClose();
  };

  const handleReset = () => {
    setCapabilities([]);
    setDistance('All');
    setVerificationStatus('All');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {/* Multi-select for capabilities */}
            <FilterDropdown
              title="Capability Filter"
              options={CAPABILITY_OPTIONS}
              selected={capabilities}
              onApply={(selected) => setCapabilities(selected as string[])}
              showLimit={4}
              multiSelect={true}
            />

            {/* Single-select for distance */}
            <FilterDropdown
              title="Distance Filter"
              options={DISTANCE_OPTIONS}
              selected={distance}
              onApply={(selected) => setDistance(selected as string)}
              showLimit={4}
              multiSelect={false}
            />

            {/* Single-select for verification */}
            <FilterDropdown
              title="Verification Status"
              options={VERIFICATION_OPTIONS}
              selected={verificationStatus}
              onApply={(selected) => setVerificationStatus(selected as string)}
              showLimit={4}
              multiSelect={false}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleReset}
            >
              <Text style={styles.resetText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={handleApplyAll}
            >
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  body: {
    padding: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.black20,
    gap: Spacing.md,
  },
  resetButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  applyButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
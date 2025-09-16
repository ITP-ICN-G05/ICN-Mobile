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
  'All',
  '500m',
  '1km',
  '5km',
  '10km',
  '50km',
];

const VERIFICATION_OPTIONS = [
  'All',
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
            {/* Multi-select dropdown for capabilities */}
            <FilterDropdown
              title="Capability Filter"
              options={CAPABILITY_OPTIONS}
              selected={capabilities}
              onApply={(selected) => setCapabilities(selected as string[])}
              showLimit={4}
              multiSelect={true}
            />

            {/* Button group for distance */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Distance Filter</Text>
              <View style={styles.buttonGroup}>
                {DISTANCE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      distance === option && styles.optionButtonSelected
                    ]}
                    onPress={() => setDistance(option)}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      distance === option && styles.optionButtonTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Button group for verification */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Verification Status</Text>
              <View style={styles.buttonGroup}>
                {VERIFICATION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      verificationStatus === option && styles.optionButtonSelected
                    ]}
                    onPress={() => setVerificationStatus(option)}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      verificationStatus === option && styles.optionButtonTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black50,
    marginBottom: Spacing.sm,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.black20,
    backgroundColor: Colors.white,
    minWidth: 60,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  optionButtonTextSelected: {
    color: Colors.white,
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
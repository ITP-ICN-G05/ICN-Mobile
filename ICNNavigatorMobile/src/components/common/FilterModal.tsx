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
import { Colors, Spacing } from '../../constants/colors';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters?: FilterOptions;
}

export interface FilterOptions {
  capabilities: string[];
  distance: string;
  verificationStatus: 'all' | 'verified' | 'unverified';
}

const CAPABILITY_TYPES = ['All', 'Service Provider', 'Item Supplier', 'Manufacturer', 'Retailer'];
const DISTANCES = ['All', '1km', '5km', '10km', '50km'];

export default function FilterModal({ 
  visible, 
  onClose, 
  onApply,
  currentFilters 
}: FilterModalProps) {
  const [selectedCapability, setSelectedCapability] = useState(
    currentFilters?.capabilities?.[0] || 'All'
  );
  const [selectedDistance, setSelectedDistance] = useState(
    currentFilters?.distance || 'All'
  );
  const [verificationStatus, setVerificationStatus] = useState<'all' | 'verified' | 'unverified'>(
    currentFilters?.verificationStatus || 'all'
  );

  const handleReset = () => {
    setSelectedCapability('All');
    setSelectedDistance('All');
    setVerificationStatus('all');
  };

  const handleApply = () => {
    onApply({
      capabilities: selectedCapability === 'All' ? [] : [selectedCapability],
      distance: selectedDistance,
      verificationStatus: verificationStatus,
    });
    onClose();
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
            <Text style={styles.title}>Filter</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Capability types</Text>
              <View style={styles.chips}>
                {CAPABILITY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      selectedCapability === type && styles.chipSelected,
                    ]}
                    onPress={() => setSelectedCapability(type)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedCapability === type && styles.chipTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distance</Text>
              <View style={styles.chips}>
                {DISTANCES.map((distance) => (
                  <TouchableOpacity
                    key={distance}
                    style={[
                      styles.chip,
                      selectedDistance === distance && styles.chipSelected,
                    ]}
                    onPress={() => setSelectedDistance(distance)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedDistance === distance && styles.chipTextSelected,
                      ]}
                    >
                      {distance}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Verification Status</Text>
              <View style={styles.chips}>
                {['all', 'verified', 'unverified'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.chip,
                      verificationStatus === status && styles.chipSelected,
                    ]}
                    onPress={() => setVerificationStatus(status as any)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        verificationStatus === status && styles.chipTextSelected,
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyText}>Apply</Text>
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
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.black20,
    backgroundColor: Colors.white,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.text,
  },
  chipTextSelected: {
    color: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.black20,
    gap: Spacing.md,
  },
  resetButton: {
    flex: 1,
    padding: 14,
    borderRadius: 25,
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
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
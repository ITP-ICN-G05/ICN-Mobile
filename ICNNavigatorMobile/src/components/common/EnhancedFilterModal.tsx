// src/components/common/EnhancedFilterModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import FilterDropdown from './FilterDropdown';
import { Colors, Spacing } from '../../constants/colors';
import { useUserTier } from '../../contexts/UserTierContext';

export interface EnhancedFilterOptions {
  // Basic filters (all tiers)
  capabilities: string[];
  distance: string;
  sectors: string[];
  
  // Plus tier filters
  companySize?: string;
  certifications?: string[];
  
  // Premium tier filters
  ownershipType?: string[];
  revenue?: { min: number; max: number };
  employeeCount?: { min: number; max: number };
  socialEnterprise?: boolean;
  australianDisability?: boolean;
  localContentPercentage?: number;
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

const SECTOR_OPTIONS = [
  'Construction',
  'Manufacturing',
  'Healthcare',
  'Education',
  'Technology',
  'Mining',
  'Agriculture',
  'Transport',
];

const SIZE_OPTIONS = [
  'SME (1-50)',
  'Medium (51-200)',
  'Large (201-500)',
  'Enterprise (500+)',
];

const CERTIFICATION_OPTIONS = [
  'ISO 9001',
  'ISO 14001',
  'AS/NZS 4801',
  'Quality Assurance',
  'Environmental',
];

const OWNERSHIP_OPTIONS = [
  'Female-owned',
  'First Nations-owned',
  'Veteran-owned',
  'Minority-owned',
];

interface LockedFeatureProps {
  featureName: string;
  requiredTier: 'plus' | 'premium';
  onUpgrade: () => void;
}

const LockedFeature = ({ featureName, requiredTier, onUpgrade }: LockedFeatureProps) => (
  <TouchableOpacity style={styles.lockedFeature} onPress={onUpgrade}>
    <View style={styles.lockedContent}>
      <MaterialIcons name="lock" size={20} color={Colors.black50} />
      <Text style={styles.lockedText}>{featureName}</Text>
      <View style={styles.tierBadge}>
        <Text style={styles.tierBadgeText}>
          {requiredTier === 'plus' ? 'Plus' : 'Premium'}
        </Text>
      </View>
    </View>
    <Text style={styles.upgradeHint}>Tap to upgrade</Text>
  </TouchableOpacity>
);

export default function EnhancedFilterModal({ 
  visible, 
  onClose, 
  onApply,
  currentFilters,
  onNavigateToPayment
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: EnhancedFilterOptions) => void;
  currentFilters?: EnhancedFilterOptions;
  onNavigateToPayment?: () => void;
}) {
  const { currentTier, features, checkFeatureAccess } = useUserTier();
  
  // Basic filters (all tiers)
  const [capabilities, setCapabilities] = useState<string[]>(
    currentFilters?.capabilities || []
  );
  const [sectors, setSectors] = useState<string[]>(
    currentFilters?.sectors || []
  );
  const [distance, setDistance] = useState<string>(
    currentFilters?.distance || 'All'
  );
  
  // Plus tier filters
  const [companySize, setCompanySize] = useState<string>(
    currentFilters?.companySize || 'All'
  );
  const [certifications, setCertifications] = useState<string[]>(
    currentFilters?.certifications || []
  );
  
  // Premium tier filters
  const [ownershipType, setOwnershipType] = useState<string[]>(
    currentFilters?.ownershipType || []
  );
  const [socialEnterprise, setSocialEnterprise] = useState(
    currentFilters?.socialEnterprise || false
  );
  const [australianDisability, setAustralianDisability] = useState(
    currentFilters?.australianDisability || false
  );

  const handleApplyAll = () => {
    const filters: EnhancedFilterOptions = {
      capabilities,
      sectors,
      distance,
    };

    // Only include Plus/Premium filters if user has access
    if (features.canFilterBySize) {
      filters.companySize = companySize;
      filters.certifications = certifications;
    }
    
    if (features.canFilterByDiversity) {
      filters.ownershipType = ownershipType;
      filters.socialEnterprise = socialEnterprise;
      filters.australianDisability = australianDisability;
    }

    onApply(filters);
    onClose();
  };

  const handleUpgradePrompt = (requiredTier: 'plus' | 'premium') => {
    Alert.alert(
      `${requiredTier === 'plus' ? 'Plus' : 'Premium'} Feature`,
      `This filter is available in the ${requiredTier === 'plus' ? 'Plus' : 'Premium'} tier. Would you like to upgrade?`,
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'View Plans', 
          onPress: () => {
            onClose();
            onNavigateToPayment?.();
          }
        },
      ]
    );
  };

  const handleReset = () => {
    setCapabilities([]);
    setSectors([]);
    setDistance('All');
    setCompanySize('All');
    setCertifications([]);
    setOwnershipType([]);
    setSocialEnterprise(false);
    setAustralianDisability(false);
  };

  // Wrapper functions to handle the onApply callbacks properly
  const handleCapabilitiesChange = (selected: string | string[]) => {
    setCapabilities(Array.isArray(selected) ? selected : [selected]);
  };

  const handleSectorsChange = (selected: string | string[]) => {
    setSectors(Array.isArray(selected) ? selected : [selected]);
  };

  const handleDistanceChange = (selected: string | string[]) => {
    setDistance(typeof selected === 'string' ? selected : selected[0] || 'All');
  };

  const handleCompanySizeChange = (selected: string | string[]) => {
    setCompanySize(typeof selected === 'string' ? selected : selected[0] || 'All');
  };

  const handleCertificationsChange = (selected: string | string[]) => {
    setCertifications(Array.isArray(selected) ? selected : [selected]);
  };

  const handleOwnershipTypeChange = (selected: string | string[]) => {
    setOwnershipType(Array.isArray(selected) ? selected : [selected]);
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
            <View style={styles.tierIndicator}>
              <Text style={styles.tierText}>Your tier: {currentTier.toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {/* Basic Filters - Available to all */}
            <Text style={styles.sectionTitle}>Basic Filters</Text>
            
            <FilterDropdown
              title="Capability Types"
              options={CAPABILITY_OPTIONS}
              selected={capabilities}
              onApply={handleCapabilitiesChange}
              multiSelect={true}
            />

            <FilterDropdown
              title="Sectors"
              options={SECTOR_OPTIONS}
              selected={sectors}
              onApply={handleSectorsChange}
              multiSelect={true}
            />

            <FilterDropdown
              title="Distance"
              options={['All', '500m', '1km', '5km', '10km', '50km']}
              selected={distance}
              onApply={handleDistanceChange}
              multiSelect={false}
            />

            {/* Plus Tier Filters */}
            <Text style={styles.sectionTitle}>Advanced Filters</Text>
            
            {features.canFilterBySize ? (
              <FilterDropdown
                title="Company Size"
                options={SIZE_OPTIONS}
                selected={companySize}
                onApply={handleCompanySizeChange}
                multiSelect={false}
              />
            ) : (
              <LockedFeature 
                featureName="Company Size Filter"
                requiredTier="plus"
                onUpgrade={() => handleUpgradePrompt('plus')}
              />
            )}

            {features.canFilterByCertifications ? (
              <FilterDropdown
                title="Certifications"
                options={CERTIFICATION_OPTIONS}
                selected={certifications}
                onApply={handleCertificationsChange}
                multiSelect={true}
              />
            ) : (
              <LockedFeature 
                featureName="Certification Filters"
                requiredTier="plus"
                onUpgrade={() => handleUpgradePrompt('plus')}
              />
            )}

            {/* Premium Tier Filters */}
            <Text style={styles.sectionTitle}>Social Procurement</Text>
            
            {features.canFilterByDiversity ? (
              <>
                <FilterDropdown
                  title="Ownership Type"
                  options={OWNERSHIP_OPTIONS}
                  selected={ownershipType}
                  onApply={handleOwnershipTypeChange}
                  multiSelect={true}
                />
                
                <View style={styles.checkboxSection}>
                  <TouchableOpacity 
                    style={styles.checkboxRow}
                    onPress={() => setSocialEnterprise(!socialEnterprise)}
                  >
                    <View style={[styles.checkbox, socialEnterprise && styles.checkboxChecked]}>
                      {socialEnterprise && (
                        <Ionicons name="checkmark" size={16} color={Colors.white} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Social Enterprises Only</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.checkboxRow}
                    onPress={() => setAustralianDisability(!australianDisability)}
                  >
                    <View style={[styles.checkbox, australianDisability && styles.checkboxChecked]}>
                      {australianDisability && (
                        <Ionicons name="checkmark" size={16} color={Colors.white} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Australian Disability Enterprises</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <LockedFeature 
                featureName="Social Procurement Filters"
                requiredTier="premium"
                onUpgrade={() => handleUpgradePrompt('premium')}
              />
            )}
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
    maxHeight: '90%',
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
  tierIndicator: {
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  body: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  lockedFeature: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.black20,
  },
  lockedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockedText: {
    flex: 1,
    fontSize: 15,
    color: Colors.black50,
  },
  tierBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tierBadgeText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '600',
  },
  upgradeHint: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  checkboxSection: {
    marginVertical: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.black50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: 15,
    color: Colors.text,
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
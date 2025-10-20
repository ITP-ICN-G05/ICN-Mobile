import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import FilterDropdown from './FilterDropdown';
import { Colors, Spacing } from '../../constants/colors';
import { useUserTier } from '../../contexts/UserTierContext';

// Standardized Australian States/Territories + New Zealand
const STANDARD_STATES_TERRITORIES = [
  'VIC',  // Victoria
  'NSW',  // New South Wales
  'QLD',  // Queensland
  'SA',   // South Australia
  'WA',   // Western Australia
  'NT',   // Northern Territory
  'TAS',  // Tasmania
  'ACT',  // Australian Capital Territory
  'NI',   // North Island, New Zealand
  'SI'    // South Island, New Zealand
];

export interface EnhancedFilterOptions {
  // Basic filters (all tiers)
  capabilities: string[];
  distance: string;
  sectors: string[];
  state?: string;  // Only valid state codes
  companyTypes?: string[];
  
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

interface FilterOptionsFromICN {
  sectors: string[];
  states: string[];
  cities: string[];
  capabilities: string[];
  capabilityTypes?: string[];
  itemNames?: string[];
}

// Utility function to validate data
const isValidData = (value: any): boolean => {
  if (!value) return false;
  const stringValue = String(value).trim();
  return (
    stringValue !== '' &&
    stringValue !== '#N/A' &&
    stringValue !== '0' &&
    stringValue !== 'null' &&
    stringValue !== 'undefined' &&
    stringValue !== 'N/A' &&
    stringValue.toLowerCase() !== 'na'
  );
};

// Normalize state codes
const normalizeState = (state: string): string | null => {
  const upperState = state.toUpperCase().trim();
  
  // Map common variations to standard codes
  const stateMap: Record<string, string> = {
    'VICTORIA': 'VIC',
    'NEW SOUTH WALES': 'NSW',
    'QUEENSLAND': 'QLD',
    'SOUTH AUSTRALIA': 'SA',
    'WESTERN AUSTRALIA': 'WA',
    'NORTHERN TERRITORY': 'NT',
    'TASMANIA': 'TAS',
    'AUSTRALIAN CAPITAL TERRITORY': 'ACT',
    'NORTH ISLAND': 'NI',
    'NORTH ISLAND NZ': 'NI',
    'NORTH ISLAND NEW ZEALAND': 'NI',
    'SOUTH ISLAND': 'SI',
    'SOUTH ISLAND NZ': 'SI',
    'SOUTH ISLAND NEW ZEALAND': 'SI'
  };
  
  // Check if it's already a standard code
  if (STANDARD_STATES_TERRITORIES.includes(upperState)) {
    return upperState;
  }
  
  // Try to map it
  return stateMap[upperState] || null;
};

export default function EnhancedFilterModal({ 
  visible, 
  onClose, 
  onApply,
  currentFilters,
  onNavigateToPayment,
  filterOptions
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: EnhancedFilterOptions) => void;
  currentFilters?: EnhancedFilterOptions;
  onNavigateToPayment?: () => void;
  filterOptions?: FilterOptionsFromICN;
}) {
  const { currentTier, features } = useUserTier();
  
  // Updated CAPABILITY_OPTIONS to use itemNames for items/services filter
  const CAPABILITY_OPTIONS = useMemo(() => {
    if (filterOptions?.itemNames && filterOptions.itemNames.length > 0) {
      // Use actual itemNames from the data if available
      return filterOptions.itemNames
        .filter(item => isValidData(item))
        .sort();
    }
    // Fallback to empty array if no itemNames available
    return [];
  }, [filterOptions?.itemNames]);

  const SECTOR_OPTIONS = useMemo(() => {
    if (filterOptions?.sectors) {
      return filterOptions.sectors
        .filter(sector => isValidData(sector))
        .sort();
    }
    return [
      'Construction',
      'Manufacturing',
      'Healthcare',
      'Education',
      'Technology',
      'Mining',
      'Agriculture',
      'Transport',
    ];
  }, [filterOptions?.sectors]);

  // Validate and normalize states from ICN data
  const STATE_OPTIONS = useMemo(() => {
    if (filterOptions?.states) {
      const validatedStates = filterOptions.states
        .map(state => {
          if (!isValidData(state)) return null;
          return normalizeState(state);
        })
        .filter((state): state is string => state !== null)
        .filter(state => STANDARD_STATES_TERRITORIES.includes(state));

      // Remove duplicates and return in standard order
      const uniqueStates = Array.from(new Set(validatedStates));
      return STANDARD_STATES_TERRITORIES.filter(state => uniqueStates.includes(state));
    }
    return STANDARD_STATES_TERRITORIES;
  }, [filterOptions?.states]);

  // Updated COMPANY_TYPE_OPTIONS to use capabilityTypes directly, remove grouped options
  const COMPANY_TYPE_OPTIONS = useMemo(() => {
    if (filterOptions?.capabilityTypes && filterOptions.capabilityTypes.length > 0) {
      return filterOptions.capabilityTypes
        .filter(type => isValidData(type))
        .sort();
    }
    // Fallback default
    return [
      'Service Provider',
      'Manufacturer',
      'Item Supplier',
      'Supplier',
      'Designer',
      'Parts Supplier',
      'Assembler',
      'Retailer',
      'Wholesaler',
      'Project Management',
      'Manufacturer (Parts)'
    ];
  }, [filterOptions?.capabilityTypes]);

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
  
  // State management for filters
  const [capabilities, setCapabilities] = useState<string[]>(
    currentFilters?.capabilities || []
  );
  const [sectors, setSectors] = useState<string[]>(
    currentFilters?.sectors || []
  );
  const [distance, setDistance] = useState<string>(
    currentFilters?.distance || 'All'
  );
  const [state, setState] = useState<string>(
    currentFilters?.state || 'All'
  );
  const [companyTypes, setCompanyTypes] = useState<string[]>(
    currentFilters?.companyTypes || []
  );
  const [companySize, setCompanySize] = useState<string>(
    currentFilters?.companySize || 'All'
  );
  const [certifications, setCertifications] = useState<string[]>(
    currentFilters?.certifications || []
  );
  const [ownershipType, setOwnershipType] = useState<string[]>(
    currentFilters?.ownershipType || []
  );
  const [socialEnterprise, setSocialEnterprise] = useState(
    currentFilters?.socialEnterprise || false
  );
  const [australianDisability, setAustralianDisability] = useState(
    currentFilters?.australianDisability || false
  );
  const [revenueMin, setRevenueMin] = useState(
    currentFilters?.revenue?.min || 0
  );
  const [revenueMax, setRevenueMax] = useState(
    currentFilters?.revenue?.max || 10000000
  );
  const [employeeMin, setEmployeeMin] = useState(
    currentFilters?.employeeCount?.min || 0
  );
  const [employeeMax, setEmployeeMax] = useState(
    currentFilters?.employeeCount?.max || 1000
  );
  const [localContentPercentage, setLocalContentPercentage] = useState(
    currentFilters?.localContentPercentage || 0
  );

  const handleApplyAll = () => {
    console.log('[Modal] handleApplyAll - Local state before filtering:');
    console.log('  capabilities:', capabilities);
    console.log('  sectors:', sectors);
    console.log('  companyTypes:', companyTypes);
    console.log('  state:', state);
    console.log('  distance:', distance);
    
    const validCapabilities = capabilities.filter(cap => isValidData(cap));
    const validSectors = sectors.filter(sec => isValidData(sec));

    console.log('[Modal] After isValidData filtering:');
    console.log('  validCapabilities:', validCapabilities);
    console.log('  validSectors:', validSectors);

    const filters: EnhancedFilterOptions = {
      capabilities: validCapabilities,
      sectors: validSectors,
      distance,
      state: (state && state !== 'All' && STANDARD_STATES_TERRITORIES.includes(state)) ? state : undefined,
    };

    // Map the selected company types to filter values
    const mappedCompanyTypes: string[] = [];
    companyTypes.forEach(type => {
      switch(type) {
        case 'Supplier (All)':
          // Include all supplier-related types
          mappedCompanyTypes.push('Supplier', 'Item Supplier', 'Parts Supplier');
          break;
        case 'Manufacturer (All)':
          // Include all manufacturer-related types
          mappedCompanyTypes.push('Manufacturer', 'Manufacturer (Parts)', 'Assembler');
          break;
        case 'Both (Supplier & Manufacturer)':
          // This will be handled specially in the filter logic
          mappedCompanyTypes.push('Both');
          break;
        default:
          // Direct capability type
          mappedCompanyTypes.push(type);
      }
    });

    // Remove duplicates
    const uniqueCompanyTypes = Array.from(new Set(mappedCompanyTypes));
    filters.companyTypes = uniqueCompanyTypes.length > 0 ? uniqueCompanyTypes : undefined;

    console.log('[Modal] Mapped company types:', uniqueCompanyTypes);

    // Validate state selection
    if (filters.state && !STANDARD_STATES_TERRITORIES.includes(filters.state)) {
      Alert.alert(
        'Invalid State Selection',
        'Please select a valid Australian state or territory.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Add tier-based filters with validation
    if (features.canFilterBySize) {
      filters.companySize = (companySize && companySize !== 'All') ? companySize : undefined;
      const validCerts = certifications.filter(cert => isValidData(cert));
      filters.certifications = validCerts.length > 0 ? validCerts : undefined;
    }
    
    if (features.canFilterByDiversity) {
      const validOwnership = ownershipType.filter(owner => isValidData(owner));
      filters.ownershipType = validOwnership.length > 0 ? validOwnership : undefined;
      filters.socialEnterprise = socialEnterprise || undefined;
      filters.australianDisability = australianDisability || undefined;
    }

    if (features.canFilterByRevenue) {
      if (revenueMin >= 0 && revenueMax > revenueMin) {
        filters.revenue = (revenueMin > 0 || revenueMax < 10000000) 
          ? { min: revenueMin, max: revenueMax } 
          : undefined;
      }
      
      if (employeeMin >= 0 && employeeMax > employeeMin) {
        filters.employeeCount = (employeeMin > 0 || employeeMax < 1000)
          ? { min: employeeMin, max: employeeMax }
          : undefined;
      }
      
      filters.localContentPercentage = (localContentPercentage > 0 && localContentPercentage <= 100) 
        ? localContentPercentage 
        : undefined;
    }

    console.log('[Modal] Final filters object:', filters);

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
    setState('All');
    setCompanyTypes([]);
    setCompanySize('All');
    setCertifications([]);
    setOwnershipType([]);
    setSocialEnterprise(false);
    setAustralianDisability(false);
    setRevenueMin(0);
    setRevenueMax(10000000);
    setEmployeeMin(0);
    setEmployeeMax(1000);
    setLocalContentPercentage(0);
  };

  // Handler functions for filters
  const handleCapabilitiesChange = (selected: string | string[]) => {
    const newValue = Array.isArray(selected) ? selected : [selected];
    console.log('[Modal] Capabilities changed:', newValue);
    setCapabilities(newValue);
  };

  const handleSectorsChange = (selected: string | string[]) => {
    const newValue = Array.isArray(selected) ? selected : [selected];
    console.log('[Modal] Sectors changed:', newValue);
    setSectors(newValue);
  };

  const handleDistanceChange = (selected: string | string[]) => {
    const newValue = typeof selected === 'string' ? selected : selected[0] || 'All';
    console.log('[Modal] Distance changed:', newValue);
    setDistance(newValue);
  };

  const handleStateChange = (selected: string | string[]) => {
    const newValue = typeof selected === 'string' ? selected : selected[0] || 'All';
    console.log('[Modal] State changed:', newValue);
    setState(newValue);
  };

  const handleCompanyTypesChange = (selected: string | string[]) => {
    const newValue = Array.isArray(selected) ? selected : [selected];
    console.log('[Modal] Company types changed:', newValue);
    setCompanyTypes(newValue);
  };

  const handleCompanySizeChange = (selected: string | string[]) => {
    const newValue = typeof selected === 'string' ? selected : selected[0] || 'All';
    console.log('[Modal] Company size changed:', newValue);
    setCompanySize(newValue);
  };

  const handleCertificationsChange = (selected: string | string[]) => {
    const newValue = Array.isArray(selected) ? selected : [selected];
    console.log('[Modal] Certifications changed:', newValue);
    setCertifications(newValue);
  };

  const handleOwnershipTypeChange = (selected: string | string[]) => {
    const newValue = Array.isArray(selected) ? selected : [selected];
    console.log('[Modal] Ownership type changed:', newValue);
    setOwnershipType(newValue);
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (capabilities.length > 0) count++;
    if (sectors.length > 0) count++;
    if (state !== 'All') count++;
    if (companyTypes.length > 0) count++;
    if (distance !== 'All') count++;
    if (companySize !== 'All' && features.canFilterBySize) count++;
    if (certifications.length > 0 && features.canFilterByCertifications) count++;
    if (ownershipType.length > 0 && features.canFilterByDiversity) count++;
    if (socialEnterprise && features.canFilterByDiversity) count++;
    if (australianDisability && features.canFilterByDiversity) count++;
    if ((revenueMin > 0 || revenueMax < 10000000) && features.canFilterByRevenue) count++;
    if ((employeeMin > 0 || employeeMax < 1000) && features.canFilterByRevenue) count++;
    if (localContentPercentage > 0 && features.canFilterByRevenue) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

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
            <Text style={styles.title}>
              Filters {activeFilterCount > 0 && `(${activeFilterCount} active)`}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {/* Basic Filters Section */}
            <Text style={styles.sectionTitle}>Basic Filters</Text>

            <FilterDropdown
              title="Company Type"
              options={COMPANY_TYPE_OPTIONS}
              selected={companyTypes}
              onApply={handleCompanyTypesChange}
              multiSelect={true}
              showLimit={5}
            />

            <FilterDropdown
              title="Capabilities"
              options={CAPABILITY_OPTIONS}
              selected={capabilities}
              onApply={handleCapabilitiesChange}
              multiSelect={true}
            />

            <FilterDropdown
              title="Industry Sectors"
              options={SECTOR_OPTIONS}
              selected={sectors}
              onApply={handleSectorsChange}
              multiSelect={true}
            />

            {/* State Filter with validation info */}
            <FilterDropdown
              title="State/Territory"
              options={['All', ...STATE_OPTIONS]}
              selected={state}
              onApply={handleStateChange}
              multiSelect={false}
            />
            
            {/* Show state filter info */}
            <View style={styles.filterInfo}>
              <Text style={styles.filterInfoText}>
                Showing {STATE_OPTIONS.length} territories (AU/NZ)
              </Text>
            </View>

            <FilterDropdown
              title="Distance from Location"
              options={['All', '500m', '1km', '5km', '10km', '50km', '100km']}
              selected={distance}
              onApply={handleDistanceChange}
              multiSelect={false}
            />

            {/* Plus Tier Filters */}
            <Text style={styles.sectionTitle}>Advanced Filters</Text>
            
            {features.canFilterBySize ? (
              <FilterDropdown
                title="Company Size"
                options={['All', ...SIZE_OPTIONS]}
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

            {/* Premium Financial Filters */}
            <Text style={styles.sectionTitle}>Financial & Scale Filters</Text>
            
            {features.canFilterByRevenue ? (
              <>
                {/* Revenue Range Filter */}
                <View style={styles.rangeSection}>
                  <Text style={styles.filterLabel}>Annual Revenue Range (AUD)</Text>
                  <View style={styles.rangeInputContainer}>
                    <View style={styles.rangeInputWrapper}>
                      <Text style={styles.rangeInputLabel}>Min:</Text>
                      <TextInput
                        style={styles.rangeInput}
                        placeholder="$0"
                        value={revenueMin ? `${revenueMin.toLocaleString()}` : ''}
                        onChangeText={(text) => {
                          const numValue = parseInt(text.replace(/[^0-9]/g, '') || '0');
                          setRevenueMin(numValue);
                        }}
                        keyboardType="numeric"
                        placeholderTextColor={Colors.black50}
                      />
                    </View>
                    <Text style={styles.rangeSeparator}>-</Text>
                    <View style={styles.rangeInputWrapper}>
                      <Text style={styles.rangeInputLabel}>Max:</Text>
                      <TextInput
                        style={styles.rangeInput}
                        placeholder="$10,000,000"
                        value={revenueMax ? `${revenueMax.toLocaleString()}` : ''}
                        onChangeText={(text) => {
                          const numValue = parseInt(text.replace(/[^0-9]/g, '') || '10000000');
                          setRevenueMax(numValue);
                        }}
                        keyboardType="numeric"
                        placeholderTextColor={Colors.black50}
                      />
                    </View>
                  </View>
                </View>

                {/* Employee Count Range Filter */}
                <View style={styles.rangeSection}>
                  <Text style={styles.filterLabel}>Employee Count Range</Text>
                  <View style={styles.rangeInputContainer}>
                    <View style={styles.rangeInputWrapper}>
                      <Text style={styles.rangeInputLabel}>Min:</Text>
                      <TextInput
                        style={styles.rangeInput}
                        placeholder="0"
                        value={employeeMin ? employeeMin.toString() : ''}
                        onChangeText={(text) => {
                          const numValue = parseInt(text.replace(/[^0-9]/g, '') || '0');
                          setEmployeeMin(numValue);
                        }}
                        keyboardType="numeric"
                        placeholderTextColor={Colors.black50}
                      />
                    </View>
                    <Text style={styles.rangeSeparator}>-</Text>
                    <View style={styles.rangeInputWrapper}>
                      <Text style={styles.rangeInputLabel}>Max:</Text>
                      <TextInput
                        style={styles.rangeInput}
                        placeholder="1000+"
                        value={employeeMax ? employeeMax.toString() : ''}
                        onChangeText={(text) => {
                          const numValue = parseInt(text.replace(/[^0-9]/g, '') || '1000');
                          setEmployeeMax(numValue);
                        }}
                        keyboardType="numeric"
                        placeholderTextColor={Colors.black50}
                      />
                    </View>
                  </View>
                </View>

                {/* Local Content Percentage Filter */}
                <View style={styles.rangeSection}>
                  <Text style={styles.filterLabel}>Minimum Local Content %</Text>
                  <View style={styles.percentageInputContainer}>
                    <TextInput
                      style={styles.percentageInput}
                      placeholder="0"
                      value={localContentPercentage ? localContentPercentage.toString() : ''}
                      onChangeText={(text) => {
                        const numValue = parseInt(text.replace(/[^0-9]/g, '') || '0');
                        setLocalContentPercentage(Math.min(100, Math.max(0, numValue)));
                      }}
                      keyboardType="numeric"
                      placeholderTextColor={Colors.black50}
                      maxLength={3}
                    />
                    <Text style={styles.percentageSymbol}>%</Text>
                  </View>
                </View>
              </>
            ) : (
              <LockedFeature 
                featureName="Financial & Scale Filters"
                requiredTier="premium"
                onUpgrade={() => handleUpgradePrompt('premium')}
              />
            )}
            
            {/* Filter Statistics */}
            {filterOptions && (
              <View style={styles.statsInfo}>
                <Text style={styles.statsTitle}>Filter Statistics</Text>
                <Text style={styles.statsText}>
                  {CAPABILITY_OPTIONS.length} capabilities • {' '}
                  {SECTOR_OPTIONS.length} sectors • {' '}
                  {STATE_OPTIONS.length}/{STANDARD_STATES_TERRITORIES.length} territories
                </Text>
                {STATE_OPTIONS.length < STANDARD_STATES_TERRITORIES.length && (
                  <Text style={styles.statsWarning}>
                    Some territories may have limited data
                  </Text>
                )}
              </View>
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
              <Text style={styles.applyText}>
                Apply {activeFilterCount > 0 ? `(${activeFilterCount})` : 'Filters'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// Locked feature component
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
  filterLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  filterInfo: {
    backgroundColor: Colors.orange[400],
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  filterInfoText: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
  },
  rangeSection: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  rangeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  rangeInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeInputLabel: {
    fontSize: 14,
    color: Colors.black50,
    marginRight: 8,
    width: 35,
  },
  rangeInput: {
    flex: 1,
    backgroundColor: Colors.orange[400],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.black20,
  },
  rangeSeparator: {
    fontSize: 16,
    color: Colors.black50,
    marginHorizontal: 8,
  },
  percentageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  percentageInput: {
    width: 80,
    backgroundColor: Colors.orange[400],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.black20,
    textAlign: 'center',
  },
  percentageSymbol: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 8,
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
    backgroundColor: '#F7B85C',
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
    color: '#FCCF8E',
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
  statsInfo: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.black50,
    marginBottom: 4,
  },
  statsText: {
    fontSize: 11,
    color: Colors.black50,
  },
  statsWarning: {
    fontSize: 11,
    color: Colors.warning,
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: Colors.white,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#808080',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F7B85C',
    alignItems: 'center',
  },
  applyText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
});
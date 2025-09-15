import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Keyboard,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/colors';
import { Company } from '../../types';

interface SearchBarWithDropdownProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectCompany: (company: Company) => void;
  onFilter?: () => void;
  placeholder?: string;
  companies: Company[];
}

export default function SearchBarWithDropdown({
  value,
  onChangeText,
  onSelectCompany,
  onFilter,
  placeholder = "Search companies...",
  companies,
}: SearchBarWithDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value.length > 0) {
      // Filter companies based on search text
      const filtered = companies
        .filter(company =>
          company.name.toLowerCase().includes(value.toLowerCase()) ||
          company.address.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 8); // Limit to 8 results
      
      setFilteredCompanies(filtered);
      
      if (filtered.length > 0) {
        showDropdownAnimation();
      } else {
        hideDropdownAnimation();
      }
    } else {
      hideDropdownAnimation();
    }
  }, [value, companies]);

  const showDropdownAnimation = () => {
    setShowDropdown(true);
    Animated.timing(dropdownAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideDropdownAnimation = () => {
    Animated.timing(dropdownAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowDropdown(false));
  };

  const handleSelectCompany = (company: Company) => {
    Keyboard.dismiss();
    onSelectCompany(company);
    onChangeText(company.name); // Show selected company name
    hideDropdownAnimation();
  };

  const handleClear = () => {
    onChangeText('');
    hideDropdownAnimation();
  };

  const renderCompanyItem = ({ item }: { item: Company }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleSelectCompany(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemTextContainer}>
          <View style={styles.nameContainer}>
            <Text style={styles.companyName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.verificationStatus === 'verified' && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              </View>
            )}
          </View>
          <Text style={styles.companyAddress} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        <Ionicons name="location" size={20} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.black50} />
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.black50}
            onFocus={() => value.length > 0 && showDropdownAnimation()}
          />
          {value.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={20} color={Colors.black50} />
            </TouchableOpacity>
          )}
        </View>
        {onFilter && (
          <TouchableOpacity style={styles.filterButton} onPress={onFilter}>
            <Ionicons name="filter" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {showDropdown && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity: dropdownAnimation,
              transform: [
                {
                  translateY: dropdownAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {filteredCompanies.length > 0 ? (
            <FlatList
              data={filteredCompanies}
              keyExtractor={(item) => item.id}
              renderItem={renderCompanyItem}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No companies found</Text>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    gap: 12,
  },
  searchBar: {
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
  dropdown: {
    position: 'absolute',
    top: 68,
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    maxHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: Colors.success + '20',
    borderRadius: 10,
    padding: 2,
  },
  companyAddress: {
    fontSize: 13,
    color: Colors.black50,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.black20,
    marginHorizontal: 16,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: Colors.black50,
  },
});
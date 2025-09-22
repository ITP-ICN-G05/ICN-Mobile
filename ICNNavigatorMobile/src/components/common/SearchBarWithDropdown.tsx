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
  Image,
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
          {/* Left side ICN Logo container with icon and separator */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/ICN Logo Source/ICN-logo-little.png')} 
              style={styles.logoIcon} // Use original logo colors
              resizeMode="contain"
            />
            {/* Separator line directly to the right of icon */}
            <View style={styles.separatorInContainer} />
          </View>
          
          {/* Middle search input area */}
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.black50}
            onFocus={() => value.length > 0 && showDropdownAnimation()}
            numberOfLines={1} // Limit to single line
          />
          
          {/* Right side search icon or clear button */}
          {value.length > 0 ? (
            <TouchableOpacity onPress={handleClear} style={styles.iconButton}>
              <Ionicons name="close-circle" size={20} color="#EF8059" />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton}>
              <Ionicons name="search" size={20} color="#EF8059" />
            </View>
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
    backgroundColor: 'transparent', // Ensure outermost container is also transparent
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent', // Change to transparent background
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5DAB2', // Use specified fill color
    borderRadius: 25, // Maintain rounded corners
    borderWidth: 2, // Add border
    borderColor: '#EF8059', // Use specified border color
    paddingHorizontal: 16,
    paddingVertical: 12, // Adjust vertical padding
    height: 48, // Slightly increase height
    shadowColor: '#000', // Add shadow effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    flexDirection: 'row', // Horizontal layout for icon and separator
    alignItems: 'center', // Vertical center alignment
    marginRight: 8, // Reduce container right margin to bring separator closer to text
  },
  logoIcon: {
    width: 24, // ICN logo size
    height: 24,
    marginRight: 8, // Icon right margin
  },
  separatorInContainer: {
    width: 2, // Increase separator width to make it thicker
    height: 20, // Separator height
    backgroundColor: '#EF8059', // Orange separator
  },
  input: {
    flex: 1, // Input field takes remaining space
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 0, // Remove default padding
  },
  iconButton: {
    width: 24, // Right side icon button area
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  filterButton: {
    width: 48, // Match search bar height
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF8059', // Use specified color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000', // Add shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdown: {
    position: 'absolute',
    top: 72, // Adjust position to accommodate new search bar height
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
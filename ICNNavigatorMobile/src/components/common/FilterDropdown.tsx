import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/colors';

interface FilterDropdownProps {
  title: string;
  options: string[];
  selected: string | string[];
  onApply: (selected: string | string[]) => void;
  showLimit?: number;
  multiSelect?: boolean;
}

export default function FilterDropdown({
  title,
  options,
  selected,
  onApply,
  showLimit = 4,
  multiSelect = false,
}: FilterDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  
  // Handle both string and array types
  const [tempSelected, setTempSelected] = useState<string | string[]>(selected);

  // CRITICAL FIX: Sync tempSelected with parent's selected prop when it changes
  useEffect(() => {
    setTempSelected(selected);
  }, [selected]);

  // Reset expansion state when selected changes (cleaner UX)
  useEffect(() => {
    setIsExpanded(false);
    setShowMore(false);
  }, [selected]);

  // Filter out "All" from options if it exists, as we'll add it separately
  const filteredOptions = options.filter(opt => opt !== 'All');
  const visibleOptions = showMore ? filteredOptions : filteredOptions.slice(0, showLimit);
  const hasMore = filteredOptions.length > showLimit;

  const isOptionSelected = (option: string) => {
    if (multiSelect) {
      return Array.isArray(tempSelected) && tempSelected.includes(option);
    }
    return tempSelected === option;
  };

  const isAllSelected = () => {
    if (multiSelect) {
      return !tempSelected || (Array.isArray(tempSelected) && tempSelected.length === 0);
    }
    return tempSelected === 'All' || !tempSelected;
  };

  const toggleOption = (option: string) => {
    if (multiSelect) {
      // Multi-select logic
      const current = Array.isArray(tempSelected) ? tempSelected : [];
      if (current.includes(option)) {
        setTempSelected(current.filter(item => item !== option));
      } else {
        setTempSelected([...current, option]);
      }
    } else {
      // Single-select logic
      setTempSelected(option);
    }
  };

  const handleSelectAll = () => {
    if (multiSelect) {
      setTempSelected([]);
    } else {
      setTempSelected('All');
    }
  };

  const handleApply = () => {
    onApply(tempSelected);
    setIsExpanded(false);
  };

  const getDisplayText = () => {
    if (multiSelect) {
      const selectedArray = Array.isArray(tempSelected) ? tempSelected : [];
      if (selectedArray.length === 0) return 'All';
      if (selectedArray.length === 1) return selectedArray[0];
      return `${selectedArray.length} selected`;
    } else {
      return tempSelected || 'All';
    }
  };

  // Reset tempSelected when dropdown is collapsed without applying
  const handleDropdownToggle = () => {
    if (isExpanded) {
      // If closing without applying, reset tempSelected to match selected
      setTempSelected(selected);
      setIsExpanded(false);
      setShowMore(false);
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <TouchableOpacity
        style={[styles.dropdown, isExpanded && styles.dropdownExpanded]}
        onPress={handleDropdownToggle}
      >
        <Text style={styles.dropdownText}>{getDisplayText()}</Text>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={Colors.text}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.optionsList}>
          {/* All option - always show this first */}
          <TouchableOpacity
            style={styles.optionItem}
            onPress={handleSelectAll}
          >
            <View style={[
              multiSelect ? styles.checkbox : styles.radio,
              isAllSelected() && (multiSelect ? styles.checkboxSelected : styles.radioSelected)
            ]}>
              {isAllSelected() && (
                multiSelect ? (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                ) : (
                  <View style={styles.radioInner} />
                )
              )}
            </View>
            <Text style={styles.optionText}>All</Text>
          </TouchableOpacity>

          {/* Individual options (excluding "All") */}
          {visibleOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.optionItem}
              onPress={() => toggleOption(option)}
            >
              <View style={[
                multiSelect ? styles.checkbox : styles.radio,
                isOptionSelected(option) && (multiSelect ? styles.checkboxSelected : styles.radioSelected)
              ]}>
                {isOptionSelected(option) && (
                  multiSelect ? (
                    <Ionicons name="checkmark" size={14} color={Colors.white} />
                  ) : (
                    <View style={styles.radioInner} />
                  )
                )}
              </View>
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}

          {/* Show more button */}
          {hasMore && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowMore(!showMore)}
            >
              <Text style={styles.showMoreText}>
                {showMore ? '− Show less' : '+ Show more'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Apply button */}
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black50,
    marginBottom: Spacing.sm,
  },
  dropdown: {
    backgroundColor: '#FAE4C5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  optionsList: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.black20,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: Spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.black20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#F7B85C',
    borderColor: '#F7B85C',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.black20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#F7B85C',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F7B85C',
  },
  optionText: {
    fontSize: 15,
    color: Colors.text,
  },
  showMoreButton: {
    paddingVertical: 10,
    marginTop: 5,
  },
  showMoreText: {
    fontSize: 14,
    color: Colors.black50,
  },
  applyButton: {
    backgroundColor: '#F7B85CE6', // Added transparency (90% opacity)
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF', // Changed to white
  },
});
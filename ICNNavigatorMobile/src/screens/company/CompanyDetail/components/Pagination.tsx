import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Colors } from '@/constants/colors';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onNext,
  onPrev,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <View style={styles.horizontalPaginationWrapper}>
      <View style={styles.horizontalPaginationContainer}>
        <TouchableOpacity 
          style={[styles.separatedNavButton, currentPage === 0 && styles.separatedNavButtonDisabled]}
          onPress={onPrev}
          disabled={currentPage === 0}
          activeOpacity={1}
        >
          <Ionicons 
            name="chevron-back" 
            size={16} 
            color={currentPage === 0 ? Colors.black50 : Colors.primary} 
          />
        </TouchableOpacity>
        
        <View style={styles.extendedPageDotsContainer}>
          {Array.from({ length: totalPages }, (_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.compactPageDot,
                index === currentPage && styles.compactPageDotActive
              ]}
              onPress={() => onPageChange(index)}
              activeOpacity={1}
            />
          ))}
        </View>
        
        <TouchableOpacity 
          style={[styles.separatedNavButton, currentPage === totalPages - 1 && styles.separatedNavButtonDisabled]}
          onPress={onNext}
          disabled={currentPage === totalPages - 1}
          activeOpacity={1}
        >
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={currentPage === totalPages - 1 ? Colors.black50 : Colors.primary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
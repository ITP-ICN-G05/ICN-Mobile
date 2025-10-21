import React from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { CARD_RAISE } from '../constants/mapConstants';
import { Company } from '@/types';

interface Props {
  onFilterPress: () => void;
  onLocationPress: () => Promise<void>;
  isLocating: boolean;
  selectedCompany: Company | null;
}

export default function MapControls({
  onFilterPress,
  onLocationPress,
  isLocating,
  selectedCompany
}: Props) {
  return (
    <View style={[
      styles.rightButtonsContainer, 
      selectedCompany && styles.rightButtonsWithCompanyDetail
    ]}>
      <TouchableOpacity 
        style={styles.filterFloatingButton} 
        onPress={onFilterPress}
      >
        <Ionicons name="filter" size={24} color={Colors.primary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={onLocationPress}
        disabled={isLocating}
      >
        {isLocating ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Ionicons name="locate" size={24} color={Colors.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  rightButtonsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    flexDirection: 'column',
    gap: 16,
    zIndex: 1001
  },
  rightButtonsWithCompanyDetail: {
    bottom: CARD_RAISE
  },
  filterFloatingButton: {
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
    elevation: 5
  },
  myLocationButton: {
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
    elevation: 5
  }
});
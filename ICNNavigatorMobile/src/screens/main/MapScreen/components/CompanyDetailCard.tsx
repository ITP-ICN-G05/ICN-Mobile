import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Company } from '@/types';

interface Props {
  company: Company | null;
  onClose: (opts?: { clearSearch?: boolean; animate?: boolean }) => void;
  onViewDetails: (company: Company) => void;
  searchText: string;
  slideAnimation: Animated.Value;
}

export default function CompanyDetailCard({
  company,
  onClose,
  onViewDetails,
  searchText,
  slideAnimation
}: Props) {
  React.useEffect(() => {
    if (company) {
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [company]);

  const handleClose = () => {
    const clearSearch = searchText.trim().toLowerCase() === company?.name.trim().toLowerCase();
    onClose({ clearSearch, animate: true });
  };

  const handleViewDetails = () => {
    if (company) {
      onViewDetails(company);
    }
  };

  if (!company) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.companyDetail, 
        { transform: [{ translateY: slideAnimation }] }
      ]}
    >
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel="Close company card"
      >
        <Ionicons name="close" size={24} color={Colors.black50} />
      </TouchableOpacity>

      <Text style={styles.detailName}>{company.name}</Text>
      <Text style={styles.detailAddress}>{company.address}</Text>
      
      <View style={styles.sectorContainer}>
        {company.keySectors.slice(0, 4).map((sector, index) => (
          <View key={index} style={styles.sectorChip}>
            <Text style={styles.sectorText}>{sector}</Text>
          </View>
        ))}
      </View>
      
      {company.verificationStatus === 'verified' && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.verifiedText}>Verified Company</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.viewDetailsButton} 
        onPress={handleViewDetails}
      >
        <Text style={styles.viewDetailsButtonText}>View Full Details</Text>
        <Ionicons name="arrow-forward" size={20} color="#D67635" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  companyDetail: {
    position: 'absolute',
    bottom: 65,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1002
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1003
  },
  detailName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4
  },
  detailAddress: {
    fontSize: 14,
    color: Colors.black50,
    marginBottom: 12
  },
  sectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  sectorChip: {
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  sectorText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500'
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  verifiedText: {
    fontSize: 14,
    color: Colors.success,
    marginLeft: 4,
    fontWeight: '500'
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5DAB2',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    marginTop: 16,
    shadowColor: '#EF8059',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4
  },
  viewDetailsButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#D67635',
    letterSpacing: 0.5
  }
});
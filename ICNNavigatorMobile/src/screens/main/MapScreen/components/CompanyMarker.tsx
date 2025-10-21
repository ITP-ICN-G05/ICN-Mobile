import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { normaliseLatLng, hasValidCoords } from '@/utils/coords';
import { Company } from '@/types';

interface Props {
  company: Company;
  isSelected: boolean;
  isFromDropdownSelection: boolean;
  searchText: string;
  markerRefs: React.MutableRefObject<Record<string, any>>;
  onPress: (company: Company) => void;
  onCalloutPress: (company: Company) => void;
}

export default function CompanyMarker({
  company,
  isSelected,
  isFromDropdownSelection,
  searchText,
  markerRefs,
  onPress,
  onCalloutPress
}: Props) {
  const getMarkerColor = () => {
    const baseColor = company.verificationStatus === 'verified' ? Colors.success : Colors.primary;
    
    if (isSelected || isFromDropdownSelection) return baseColor;
    
    if (searchText && company.name.toLowerCase().includes(searchText.toLowerCase())) {
      return Colors.warning;
    }
    
    return baseColor;
  };

  const coord = normaliseLatLng(company);
  if (!coord || !hasValidCoords(company)) {
    return null;
  }

  return (
    <Marker
      ref={(ref) => { markerRefs.current[company.id] = ref; }}
      coordinate={coord}
      onPress={() => onPress(company)}
      onCalloutPress={() => onCalloutPress(company)}
      pinColor={getMarkerColor()}
      tracksViewChanges={false}
    >
      <Callout style={styles.callout} onPress={() => onCalloutPress(company)} tooltip={false}>
        <View style={styles.calloutContent}>
          <Text style={styles.calloutTitle} numberOfLines={1}>{company.name}</Text>
          <Text style={styles.calloutAddress} numberOfLines={2}>{company.address}</Text>
          <View style={styles.calloutSectors}>
            {company.keySectors.slice(0, 3).map((sector, index) => (
              <Text key={index} style={styles.calloutSector}>{sector}</Text>
            ))}
          </View>
          {company.verificationStatus === 'verified' && (
            <View style={styles.verifiedIndicator}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
          <View style={styles.calloutButton}>
            <View style={styles.calloutButtonInner}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
              <Text style={styles.calloutButtonText}>Tap to View Details</Text>
            </View>
          </View>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  callout: {
    width: 220
  },
  calloutContent: {
    padding: 10
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4
  },
  calloutAddress: {
    fontSize: 12,
    color: Colors.black50,
    marginBottom: 8
  },
  calloutSectors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4
  },
  calloutSector: {
    fontSize: 10,
    color: Colors.primary,
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  verifiedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  verifiedText: {
    fontSize: 10,
    color: Colors.success,
    marginLeft: 4
  },
  calloutButton: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.black20,
    alignItems: 'center'
  },
  calloutButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.orange[400],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  calloutButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center'
  }
});
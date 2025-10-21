import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Colors } from '@/constants/colors';
import { getDisplayValue } from '../utils';

interface ContactInfoProps {
  company: any;
  isContactExpanded: boolean;
  onToggleExpand: () => void;
  onEmail: () => void;
  onCall: () => void;
  onWebsite: () => void;
  onICNContact: () => void;
}

export const ContactInfo: React.FC<ContactInfoProps> = ({
  company,
  isContactExpanded,
  onToggleExpand,
  onEmail,
  onCall,
  onWebsite,
  onICNContact,
}) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={onToggleExpand}
        activeOpacity={1}
      >
        <View style={styles.titleWithBadge}>
          <Text style={styles.cardTitleStyled}>Contact Details</Text>
        </View>
        <Ionicons
          name={isContactExpanded ? "chevron-up" : "chevron-down"}
          size={20} 
          color={Colors.black50} 
        />
      </TouchableOpacity>

      {isContactExpanded && (
        <View style={styles.collapsibleContent}>
          {/* Website */}
          <TouchableOpacity 
            style={styles.contactRow} 
            onPress={company.website ? onWebsite : onICNContact}
            activeOpacity={1}
          >
            <View style={[
              styles.contactIcon,
              !company.website && styles.contactIconDisabled
            ]}>
              <Ionicons 
                name="globe-outline" 
                size={20} 
                color={company.website ? Colors.primary : Colors.black50} 
              />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={[
                styles.contactValue,
                !company.website && styles.placeholderText
              ]}>
                {getDisplayValue(company.website, 'Visit ICN Portal')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity 
            style={styles.contactRow} 
            onPress={company.phoneNumber ? onCall : onICNContact}
            activeOpacity={1}
          >
            <View style={[
              styles.contactIcon,
              !company.phoneNumber && styles.contactIconDisabled
            ]}>
              <Ionicons 
                name="call-outline" 
                size={20} 
                color={company.phoneNumber ? Colors.primary : Colors.black50} 
              />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={[
                styles.contactValue,
                !company.phoneNumber && styles.placeholderText
              ]}>
                {getDisplayValue(company.phoneNumber, 'Contact via ICN Portal')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity 
            style={styles.contactRow} 
            onPress={company.email ? onEmail : onICNContact}
            activeOpacity={1}
          >
            <View style={[
              styles.contactIcon,
              !company.email && styles.contactIconDisabled
            ]}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={company.email ? Colors.primary : Colors.black50} 
              />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={[
                styles.contactValue,
                !company.email && styles.placeholderText
              ]}>
                {getDisplayValue(company.email, 'Contact via ICN Portal')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
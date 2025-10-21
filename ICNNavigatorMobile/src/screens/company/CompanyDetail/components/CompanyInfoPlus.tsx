import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Colors } from '@/constants/colors';
import { getDisplayValue } from '../utils';

interface CompanyInfoPlusProps {
  company: any;
  currentTier: string;
  isCompanyInfoExpanded: boolean;
  onToggleExpand: () => void;
  onICNChat: () => void;
  onGatewayLink: () => void;
}

export const CompanyInfoPlus: React.FC<CompanyInfoPlusProps> = ({
  company,
  currentTier,
  isCompanyInfoExpanded,
  onToggleExpand,
  onICNChat,
  onGatewayLink,
}) => {
  if (currentTier !== 'plus' && currentTier !== 'premium') {
    return null;
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.collapsibleHeader}
        onPress={onToggleExpand}
        activeOpacity={1}
      >
        <View style={styles.titleWithBadge}>
          <Text style={styles.cardTitleStyled}>Company Information</Text>
        </View>
        <Ionicons
          name={isCompanyInfoExpanded ? "chevron-up" : "chevron-down"}
          size={20} 
          color={Colors.black50} 
        />
      </TouchableOpacity>

      {isCompanyInfoExpanded && (
        <View style={styles.collapsibleContent}>
          {/* Company Summary */}
          {getDisplayValue(company.description, '') && (
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionTitle}>Company Summary</Text>
              <Text style={styles.summaryText}>{company.description}</Text>
            </View>
          )}

          {/* ICN Chat */}
          <TouchableOpacity 
            style={styles.actionRow}
            onPress={onICNChat}
            activeOpacity={1}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="chatbubbles-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Chat with ICN Victoria</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
          </TouchableOpacity>

          {/* Gateway Link */}
          <TouchableOpacity 
            style={styles.actionRow}
            onPress={onGatewayLink}
            activeOpacity={1}
          >
            <View style={styles.actionIcon}>
              <MaterialIcons name="launch" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>View on Gateway by ICN</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
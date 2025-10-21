import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Colors } from '@/constants/colors';

interface NewsTrendsProps {
  company: any;
  isNewsExpanded: boolean;
  onToggleExpand: () => void;
}

export const NewsTrends: React.FC<NewsTrendsProps> = ({
  company,
  isNewsExpanded,
  onToggleExpand,
}) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.collapsibleHeader}
        onPress={onToggleExpand}
        activeOpacity={1}
      >
        <View style={styles.clickableCardLeft}>
          <Ionicons name="newspaper-outline" size={24} color={Colors.primary} />
          <View style={styles.clickableCardText}>
            <Text style={styles.clickableCardTitle}>Industry News & Trends</Text>
            <Text style={styles.clickableCardSubtitle}>
              ICN Victoria research and insights for {company.keySectors?.[0] || 'your industry'}
            </Text>
          </View>
        </View>
        <Ionicons 
          name={isNewsExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={Colors.black50} 
        />
      </TouchableOpacity>
      
      {isNewsExpanded && (
        <View style={styles.collapsibleContent}>
          <View style={styles.newsContainer}>
            <Text style={styles.newsPlaceholder}>
              ICN Victoria Industry Research Team's thought leadership articles and trends for the {company.keySectors?.[0] || 'industry'} sector will appear here.
            </Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => Linking.openURL('https://icn.org.au/news')}
              activeOpacity={1}
            >
              <Text style={styles.viewAllText}>View All ICN News</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};
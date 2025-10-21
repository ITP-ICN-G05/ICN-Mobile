import React from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { Colors } from '@/constants/colors';

interface QuickActionsProps {
  currentTier: string;
  onDirections: () => void;
  onICNChat: () => void;
  onExport: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  currentTier,
  onDirections,
  onICNChat,
  onExport,
}) => {
  const handleICNChatPress = () => {
    if (currentTier === 'plus' || currentTier === 'premium') {
      onICNChat();
    } else {
      Alert.alert('Upgrade Required', 'Chat with ICN is available for Plus and Premium users.');
    }
  };

  return (
    <View style={styles.modernQuickActions}>
      <TouchableOpacity style={styles.modernActionButton} onPress={onDirections} activeOpacity={1}>
        <View style={styles.modernActionIconContainer}>
          <Ionicons name="navigate" size={22} color={Colors.primary} />
        </View>
        <Text style={styles.modernActionButtonText}>Get Directions</Text>
        <Text style={styles.modernActionButtonSubtext}>Navigate to location</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.modernActionButton} 
        onPress={handleICNChatPress}
        activeOpacity={1}
      >
        <View style={styles.modernActionIconContainer}>
          <Ionicons name="chatbubbles" size={22} color={Colors.success} />
        </View>
        <Text style={styles.modernActionButtonText}>Chat with ICN</Text>
        <Text style={styles.modernActionButtonSubtext}>
          {(currentTier === 'plus' || currentTier === 'premium') ? 'Get expert support' : 'Upgrade to unlock'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.modernActionButton} onPress={onExport} activeOpacity={1}>
        <View style={styles.modernActionIconContainer}>
          <Ionicons name="download" size={22} color={Colors.primary} />
        </View>
        <Text style={styles.modernActionButtonText}>Export Data</Text>
        <Text style={styles.modernActionButtonSubtext}>
          {currentTier === 'free' ? 'Basic info' : currentTier === 'plus' ? 'Limited data' : 'Complete profile'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
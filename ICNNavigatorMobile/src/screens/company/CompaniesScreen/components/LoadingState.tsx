import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles } from '../styles';
import { Colors } from '../../../../constants/colors';

export const LoadingState: React.FC = () => {
  return (
    <View style={[styles.container, styles.centerContent]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Loading ICN Navigator data...</Text>
    </View>
  );
};
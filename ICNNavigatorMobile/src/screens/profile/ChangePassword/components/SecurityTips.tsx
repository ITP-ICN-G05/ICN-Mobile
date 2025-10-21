import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

export const SecurityTips: React.FC = () => {
  const tips = [
    'Use a unique password that you don\'t use elsewhere',
    'Consider using a password manager',
    'Enable two-factor authentication for extra security',
  ];

  return (
    <View style={styles.tipsContainer}>
      <Text style={styles.tipsTitle}>Security Tips:</Text>
      {tips.map((tip, index) => (
        <View key={index} style={styles.tipRow}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
};
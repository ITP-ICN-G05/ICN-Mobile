import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';
import { PasswordStrength as PasswordStrengthType } from '../types';
import { Colors } from '../../../../constants/colors';

interface PasswordStrengthProps {
  strength: PasswordStrengthType;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ strength }) => {
  if (!strength.label) return null;

  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthHeader}>
        <Text style={styles.strengthLabel}>Password Strength:</Text>
        <Text style={[styles.strengthValue, { color: strength.color }]}>
          {strength.label}
        </Text>
      </View>
      <View style={styles.strengthBar}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[
              styles.strengthSegment,
              {
                backgroundColor: level <= strength.score
                  ? strength.color
                  : Colors.black20,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import { PasswordRequirement } from '../types';
import { Colors } from '../../../../constants/colors';

interface PasswordRequirementsProps {
  requirements: PasswordRequirement[];
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ 
  requirements 
}) => {
  return (
    <View style={styles.requirementsContainer}>
      <Text style={styles.requirementsTitle}>Password Requirements:</Text>
      {requirements.map((req, index) => (
        <View key={index} style={styles.requirementRow}>
          <Ionicons
            name={req.met ? 'checkmark-circle' : 'close-circle'}
            size={16}
            color={req.met ? Colors.success : Colors.black50}
          />
          <Text
            style={[
              styles.requirementText,
              req.met && styles.requirementMet,
            ]}
          >
            {req.text}
          </Text>
        </View>
      ))}
    </View>
  );
};
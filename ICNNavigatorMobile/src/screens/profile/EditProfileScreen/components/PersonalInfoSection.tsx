import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FormInput } from './FormInput';
import { FormField } from '../types';

interface PersonalInfoSectionProps {
  formData: any;
  errors: any;
  onFieldChange: (field: FormField, value: string) => void;
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  formData,
  errors,
  onFieldChange,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <FormInput
            label="First Name *"
            field="firstName"
            value={formData.firstName}
            error={errors.firstName}
            onChange={onFieldChange}
            placeholder="First Name"
          />
        </View>
        
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <FormInput
            label="Last Name *"
            field="lastName"
            value={formData.lastName}
            error={errors.lastName}
            onChange={onFieldChange}
            placeholder="Last Name"
          />
        </View>
      </View>

      <FormInput
        label="Email *"
        field="email"
        value={formData.email}
        error={errors.email}
        onChange={onFieldChange}
        placeholder="email@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <FormInput
        label="Phone *"
        field="phone"
        value={formData.phone}
        error={errors.phone}
        onChange={onFieldChange}
        placeholder="+61 400 000 000"
        keyboardType="phone-pad"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(27, 62, 111, 0.95)',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 16,
  },
});
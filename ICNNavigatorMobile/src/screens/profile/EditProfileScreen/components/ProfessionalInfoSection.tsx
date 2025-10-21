import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FormInput } from './FormInput';
import { FormField } from '../types';

interface ProfessionalInfoSectionProps {
  formData: any;
  errors: any;
  onFieldChange: (field: FormField, value: string) => void;
}

export const ProfessionalInfoSection: React.FC<ProfessionalInfoSectionProps> = ({
  formData,
  errors,
  onFieldChange,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Professional Information</Text>
      
      <FormInput
        label="Company"
        field="company"
        value={formData.company}
        error={errors.company}
        onChange={onFieldChange}
        placeholder="Your Company Name"
      />
      
      <FormInput
        label="Role"
        field="role"
        value={formData.role}
        error={errors.role}
        onChange={onFieldChange}
        placeholder="Your Job Title"
      />
      
      <FormInput
        label="Bio"
        field="bio"
        value={formData.bio}
        error={errors.bio}
        onChange={onFieldChange}
        placeholder="Tell us about yourself..."
        multiline={true}
        maxLength={500}
      />
      
      {formData.bio && (
        <Text style={styles.charCount}>
          {formData.bio.length}/500 characters
        </Text>
      )}
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
  charCount: {
    fontSize: 12,
    color: 'rgba(27, 62, 111, 0.6)',
    textAlign: 'right',
    marginTop: -12,
  },
});
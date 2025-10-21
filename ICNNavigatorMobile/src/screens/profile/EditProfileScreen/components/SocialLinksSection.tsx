import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FormInput } from './FormInput';
import { FormField } from '../types';

interface SocialLinksSectionProps {
  formData: any;
  errors: any;
  onFieldChange: (field: FormField, value: string) => void;
}

export const SocialLinksSection: React.FC<SocialLinksSectionProps> = ({
  formData,
  errors,
  onFieldChange,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Social Links</Text>
      
      <FormInput
        label="LinkedIn"
        field="linkedIn"
        value={formData.linkedIn}
        error={errors.linkedIn}
        onChange={onFieldChange}
        placeholder="linkedin.com/in/yourprofile"
        autoCapitalize="none"
      />
      
      <FormInput
        label="Website"
        field="website"
        value={formData.website}
        error={errors.website}
        onChange={onFieldChange}
        placeholder="yourwebsite.com"
        autoCapitalize="none"
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
});
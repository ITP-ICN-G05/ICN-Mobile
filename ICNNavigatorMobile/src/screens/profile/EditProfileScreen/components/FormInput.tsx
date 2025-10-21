import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FormField } from '../types';

interface FormInputProps {
  label: string;
  field: FormField;
  value: string;
  error?: string;
  onChange: (field: FormField, value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  maxLength?: number;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  field,
  value,
  error,
  onChange,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={(text) => onChange(field, text)}
        placeholder={placeholder}
        placeholderTextColor={Colors.black50}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(27, 62, 111, 0.85)',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(27, 62, 111, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: 'rgba(27, 62, 111, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    height: 100,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
});
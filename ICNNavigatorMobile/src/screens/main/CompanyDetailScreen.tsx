import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Company } from '../../types';

export default function CompanyDetailScreen({ route }: any) {
  const { company } = route.params as { company: Company };
  
  return (
    <ScrollView style={styles.container}>
      {/* Add company details here */}
    </ScrollView>
  );
}
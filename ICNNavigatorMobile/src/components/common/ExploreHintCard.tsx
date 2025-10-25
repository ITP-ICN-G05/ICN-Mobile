import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface ExploreHintCardProps {
  onDismiss: () => void;
  visible: boolean;
}

export default function ExploreHintCard({ onDismiss, visible }: ExploreHintCardProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.card}>
        <Ionicons name="compass-outline" size={56} color={Colors.primary} />
        <Text style={styles.title}>Start exploring</Text>
        <Text style={styles.subText}>
          Search companies, apply filters, or find nearby
        </Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={onDismiss}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Got it!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: '35%',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: '#F5DAB2', // Same yellow as search bar fill
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EF8059', // Same orange as search bar border
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 360,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subText: {
    fontSize: 15,
    color: Colors.text,
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.85,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 36,
    paddingVertical: 12,
    backgroundColor: '#EF8059', // Orange button to match border
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 140,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

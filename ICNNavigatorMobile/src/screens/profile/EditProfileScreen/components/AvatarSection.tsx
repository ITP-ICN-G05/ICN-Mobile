import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';

interface AvatarSectionProps {
  avatar: string | null;
  firstName: string;
  lastName: string;
  avatarLoading: boolean;
  onAvatarChange: (uri: string | null) => void;
  onShowAvatarOptions: () => void;
}

export const AvatarSection: React.FC<AvatarSectionProps> = ({
  avatar,
  firstName,
  lastName,
  avatarLoading,
  onAvatarChange,
  onShowAvatarOptions,
}) => {
  return (
    <View style={styles.avatarSection}>
      <TouchableOpacity 
        style={styles.avatarContainer} 
        onPress={onShowAvatarOptions}
        disabled={avatarLoading}
      >
        {avatarLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {firstName[0]}{lastName[0]}
            </Text>
          </View>
        )}
        <View style={styles.cameraButton}>
          <Ionicons name="camera" size={20} color={Colors.white} />
        </View>
      </TouchableOpacity>
      <Text style={styles.avatarHint}>Tap to change profile picture</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: Colors.black20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1B3E6F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.white,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#1B3E6F',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarHint: {
    fontSize: 14,
    color: 'rgba(27, 62, 111, 0.7)',
  },
});
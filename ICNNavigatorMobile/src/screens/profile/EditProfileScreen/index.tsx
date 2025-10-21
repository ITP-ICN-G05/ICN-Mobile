import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native';

import { Colors } from '@/constants/colors';
import { useEditProfile } from './hooks/useEditProfile';
import { useImagePicker } from './hooks/useImagePicker';
import { AvatarSection } from './components/AvatarSection';
import { PersonalInfoSection } from './components/PersonalInfoSection';
import { ProfessionalInfoSection } from './components/ProfessionalInfoSection';
import { SocialLinksSection } from './components/SocialLinksSection';

export default function EditProfileScreen() {
  const {
    formData,
    errors,
    saving,
    updateField,
    handleSave,
    setFormData,
  } = useEditProfile();

  const {
    avatarLoading,
    pickImageFromGallery,
    takePhoto,
    uploadAvatar,
  } = useImagePicker();

  const showAvatarOptions = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose a method',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Gallery', onPress: handlePickImage },
        { text: 'Remove Photo', onPress: () => setFormData((prev: any) => ({ ...prev, avatar: null })), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handlePickImage = async () => {
    const uri = await pickImageFromGallery();
    if (uri) {
      setFormData((prev: any) => ({ ...prev, avatar: uri }));
      uploadAvatar(uri);
    }
  };

  const handleTakePhoto = async () => {
    const uri = await takePhoto();
    if (uri) {
      setFormData((prev: any) => ({ ...prev, avatar: uri }));
      uploadAvatar(uri);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Image 
        src='./assets/ICN Logo Source/ICN-logo-little.png'
        style={styles.backgroundLogo}
        resizeMode="cover"
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <AvatarSection
            avatar={formData.avatar}
            firstName={formData.firstName}
            lastName={formData.lastName}
            avatarLoading={avatarLoading}
            onAvatarChange={(uri) => setFormData((prev: any) => ({ ...prev, avatar: uri }))}
            onShowAvatarOptions={showAvatarOptions}
          />

          <PersonalInfoSection
            formData={formData}
            errors={errors}
            onFieldChange={updateField}
          />

          <ProfessionalInfoSection
            formData={formData}
            errors={errors}
            onFieldChange={updateField}
          />

          <SocialLinksSection
            formData={formData}
            errors={errors}
            onFieldChange={updateField}
          />

          <TouchableOpacity style={styles.deleteButton} onPress={() => {
            Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => console.log('Delete account')
                },
              ]
            );
          }}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundLogo: {
    position: 'absolute',
    top: 100,
    left: -80,
    width: 400,
    height: 400,
    opacity: 0.05,
    zIndex: 0,
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  saveButton: {
    color: '#1B3E6F',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    gap: 8,
  },
  deleteText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '500',
  },
});
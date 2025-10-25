import React, { useState, useLayoutEffect, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';

// Utility function: Ensure safe text rendering
const safeText = (value: any): React.ReactNode => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return <Text>{String(value)}</Text>;
  }
  return value;
};
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing } from '../../constants/colors';
import { useProfile } from '../../contexts/ProfileContext';
import { useUser } from '../../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PasswordConfirmDialog from '../../components/common/PasswordConfirmDialog';

interface ProfileFormData {
  displayName: string;
  accountName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  bio: string;
  linkedIn: string;
  website: string;
  avatar: string | null;
}

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { profile, updateProfile } = useProfile();
  const { user, updateUser, logout, isLoading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    accountName: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    bio: '',
    linkedIn: '',
    website: '',
    avatar: null,
  });

  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

  // Effect 1: Load profile data (reactive to profile/user changes)
  useEffect(() => {
    // Debug: Log user and profile state
    console.log('=== EditProfileScreen - Loading data ===');
    console.log('User data:', {
      hasUser: !!user,
      userName: user?.name,
      userEmail: user?.email,
      userPhone: user?.phone,
    });
    console.log('Profile data:', {
      hasProfile: !!profile,
      profileDisplayName: profile?.displayName,
      profileEmail: profile?.email,
      profilePhone: profile?.phone,
    });
    
    // Get email from most reliable source: user context (core authentication data)
    const userEmail = user?.email || profile?.email || '';
    console.log('Derived email:', userEmail);
    console.log('Derived accountName:', userEmail ? userEmail.split('@')[0] : '(empty)');
    
    // Always update form data when user or profile changes
    if (profile || user) {
      const newFormData = {
        displayName: profile?.displayName || user?.name || '',
        accountName: userEmail ? userEmail.split('@')[0] : '',
        email: userEmail,
        phone: profile?.phone || user?.phone || '',
        company: profile?.company || user?.company || '',
        role: profile?.role || user?.role || '',
        bio: profile?.bio || '',
        linkedIn: profile?.linkedIn || '',
        website: profile?.website || '',
        avatar: profile?.avatar || null,
      };
      
      console.log('Setting form data:', newFormData);
      setFormData(newFormData);
    } else {
      console.log('WARNING: Neither user nor profile is available!');
    }
    console.log('=== End EditProfileScreen data loading ===');
  }, [profile, user]); // React to changes in profile or user

  // Image picker functions
  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your avatar.');
      return;
    }

    setAvatarLoading(true);
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    setAvatarLoading(false);

    if (!result.canceled && result.assets[0]) {
      setFormData({ ...formData, avatar: result.assets[0].uri });
      // Here you would upload to your backend
      uploadAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your camera to take a photo.');
      return;
    }

    setAvatarLoading(true);
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    setAvatarLoading(false);

    if (!result.canceled && result.assets[0]) {
      setFormData({ ...formData, avatar: result.assets[0].uri });
      // Here you would upload to your backend
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    // TODO: Implement actual upload to backend
    // Example:
    // const formData = new FormData();
    // formData.append('avatar', {
    //   uri,
    //   type: 'image/jpeg',
    //   name: 'avatar.jpg',
    // } as any);
    // 
    // await api.uploadAvatar(formData);
    console.log('Uploading avatar:', uri);
  };

  const showAvatarOptions = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose a method',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImageFromGallery },
        { text: 'Remove Photo', onPress: () => setFormData({ ...formData, avatar: null }), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    const email = formData.email.trim();
    if (!email) {
      newErrors.email = 'Email is required and cannot be empty';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.phone.trim() && !/^\+?[\d\s()-]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    if (formData.linkedIn && !formData.linkedIn.includes('linkedin.com')) {
      newErrors.linkedIn = 'Please enter a valid LinkedIn URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSave = useCallback(async () => {
    // 0. Extra safety check for email
    if (!formData.email || !formData.email.trim()) {
      Alert.alert(
        'Email Required',
        'Email cannot be empty. Please enter a valid email address.',
        [{ text: 'OK' }]
      );
      return;
    }

    // 1. Check user authentication state
    if (!user || userLoading) {
      Alert.alert(
        'Login Required',
        'Please login to update your profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Login', onPress: () => navigation.navigate('Auth' as never) },
        ]
      );
      return;
    }

    // 2. Form validation
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check the form and fix any errors.');
      return;
    }

    // 3. Check if name or email changed (needs backend sync)
    const nameChanged = formData.displayName !== (profile?.displayName || user?.name || '');
    const emailChanged = formData.email !== (profile?.email || user?.email || '');
    
    if (nameChanged || emailChanged) {
      // Show password dialog for backend sync
      setShowPasswordDialog(true);
    } else {
      // No backend sync needed, save directly
      await saveProfileChanges();
    }
  }, [formData, validateForm, user, userLoading, profile, navigation]);

  const saveProfileChanges = async (password?: string) => {
    setSaving(true);

    try {
      // Update profile with optional password
      await updateProfile({
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        role: formData.role,
        bio: formData.bio,
        linkedIn: formData.linkedIn,
        website: formData.website,
        avatar: formData.avatar,
      }, password);

      // Also update user context
      if (user) {
        await updateUser({
          ...user,
          name: formData.displayName, // Update user.name with displayName
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          role: formData.role,
        }, password);
      }
      
      // SUCCESS: Go back immediately
      navigation.goBack();
      
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile.';
      
      // Show error message for any issues
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    await saveProfileChanges(password);
    setShowPasswordDialog(false);
  };

  const handlePasswordCancel = () => {
    setShowPasswordDialog(false);
  };

  // Effect 2: Set header (after handleSave is defined)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, saving, handleSave]); // Added handleSave dependency

  const renderInput = (
    label: string,
    key: keyof ProfileFormData,
    placeholder: string,
    options: {
      multiline?: boolean;
      keyboardType?: any;
      autoCapitalize?: any;
      maxLength?: number;
    } = {}
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          options.multiline && styles.textArea,
          errors[key] && styles.inputError,
        ]}
        value={formData[key] as string}
        onChangeText={(text) => {
          // Update form data with new value
          setFormData(prev => ({ 
            ...prev, 
            [key]: text,
            // Auto-update accountName when email changes
            ...(key === 'email' && { accountName: text.split('@')[0] })
          }));
          // Clear validation error for this field
          if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: undefined }));
          }
        }}
        placeholder={placeholder}
        placeholderTextColor={Colors.black50}
        {...options}
      />
      {errors[key] && (
        <Text style={styles.errorText}>{errors[key]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Background Logo */}
      <Image 
        source={require('../../../assets/ICN Logo Source/ICN-logo-little.png')} 
        style={styles.backgroundLogo}
        resizeMode="cover"
      />
      
      {/* Show loading indicator while waiting for user data */}
      {(userLoading || (!user && !profile)) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              style={styles.avatarContainer} 
              onPress={showAvatarOptions}
              disabled={avatarLoading}
            >
              {avatarLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : formData.avatar ? (
                <Image source={{ uri: formData.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {String(formData.displayName || '').split(' ').map((n: string) => n[0]).join('')}
                  </Text>
                </View>
              )}
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={20} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change profile picture</Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            {renderInput('Display Name *', 'displayName', 'Enter your display name')}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Name</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.accountName}
                editable={false}
                placeholder="Account Name"
                placeholderTextColor={Colors.black50}
              />
              <Text style={styles.helperText}>
                This is your unique account identifier and cannot be changed
                {__DEV__ && ` (Debug: "${formData.accountName || 'EMPTY'}")`}
              </Text>
            </View>

            {renderInput('Email *', 'email', 'email@example.com', {
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}
            
            {renderInput('Phone', 'phone', '+61 400 000 000 (optional)', {
              keyboardType: 'phone-pad',
            })}
          </View>

          {/* Professional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Information</Text>
            
            {renderInput('Company', 'company', 'Your Company Name')}
            {renderInput('Role', 'role', 'Your Job Title')}
            {renderInput('Bio', 'bio', 'Tell us about yourself...', {
              multiline: true,
              maxLength: 500,
            })}
            {formData.bio && (
              <Text style={styles.charCount}>
                {(formData.bio || '').length}/500 characters
              </Text>
            )}
          </View>

          {/* Social Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Social Links</Text>
            
            {renderInput('LinkedIn', 'linkedIn', 'linkedin.com/in/yourprofile', {
              autoCapitalize: 'none',
            })}
            
            {renderInput('Website', 'website', 'yourwebsite.com', {
              autoCapitalize: 'none',
            })}
          </View>

          {/* Delete Account Option */}
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
      )}

      {/* Password Confirmation Dialog */}
      <PasswordConfirmDialog
        visible={showPasswordDialog}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
        title="Confirm Password"
        message="Your name or email has changed. Please enter your password to sync these changes to the server."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background like ProfileScreen
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(27, 62, 111, 0.7)',
  },
  backgroundLogo: {
    position: 'absolute',
    top: 100,
    left: -80,
    width: 400,
    height: 400,
    opacity: 0.05, // Same subtle opacity as ProfileScreen
    zIndex: 0,
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent to show background logo
  },
  scrollContent: {
    paddingBottom: 40,
  },
  saveButton: {
    color: '#1B3E6F', // Match ProfileScreen button color
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent like ProfileScreen
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12, // Match SubscriptionCard radius
    shadowColor: '#000', // Match ProfileScreen shadow
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
    backgroundColor: '#1B3E6F', // Match ProfileScreen avatar color
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
    backgroundColor: '#1B3E6F', // Match ProfileScreen edit button color
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
    color: 'rgba(27, 62, 111, 0.7)', // Match ProfileScreen text color
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent like ProfileScreen
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12, // Match SubscriptionCard radius
    padding: 20, // Match ProfileScreen padding
    shadowColor: '#000', // Match ProfileScreen shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(27, 62, 111, 0.95)', // Match ProfileScreen title color
    marginBottom: 16,
    letterSpacing: 0.3, // Match ProfileScreen letter spacing
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(27, 62, 111, 0.85)', // Match ProfileScreen setting title color
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(27, 62, 111, 0.2)', // Subtle blue border
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: 'rgba(27, 62, 111, 0.9)', // Match ProfileScreen text color
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent input background
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
  charCount: {
    fontSize: 12,
    color: 'rgba(27, 62, 111, 0.6)', // Match ProfileScreen secondary text color
    textAlign: 'right',
    marginTop: -12,
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
  disabledInput: {
    backgroundColor: 'rgba(27, 62, 111, 0.05)',
    color: 'rgba(27, 62, 111, 0.5)',
  },
  helperText: {
    fontSize: 11,
    color: 'rgba(27, 62, 111, 0.5)',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
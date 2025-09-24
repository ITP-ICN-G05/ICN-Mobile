import React, { useState, useLayoutEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing } from '../../constants/colors';

interface ProfileFormData {
  firstName: string;
  lastName: string;
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+61 400 123 456',
    company: 'ABC Construction',
    role: 'Project Manager',
    bio: 'Experienced project manager with over 10 years in the construction industry.',
    linkedIn: 'linkedin.com/in/johnsmith',
    website: 'johnsmith.com',
    avatar: null,
  });

  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

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
  }, [navigation, saving, formData]);

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
  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s()-]+$/.test(formData.phone)) {
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
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check the form and fix any errors.');
      return;
    }

    setSaving(true);

    try {
      // TODO: Implement actual API call to save profile
      // await api.updateProfile(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Success',
        'Your profile has been updated successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
          setFormData({ ...formData, [key]: text });
          if (errors[key]) {
            setErrors({ ...errors, [key]: undefined });
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
                    {formData.firstName[0]}{formData.lastName[0]}
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
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  value={formData.firstName}
                  onChangeText={(text) => {
                    setFormData({ ...formData, firstName: text });
                    if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                  }}
                  placeholder="First Name"
                  placeholderTextColor={Colors.black50}
                />
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  value={formData.lastName}
                  onChangeText={(text) => {
                    setFormData({ ...formData, lastName: text });
                    if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                  }}
                  placeholder="Last Name"
                  placeholderTextColor={Colors.black50}
                />
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
            </View>

            {renderInput('Email *', 'email', 'email@example.com', {
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}
            
            {renderInput('Phone *', 'phone', '+61 400 000 000', {
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
                {formData.bio.length}/500 characters
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background like ProfileScreen
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
});
import { useState, useLayoutEffect, useEffect } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from '@/contexts/ProfileContext';
import { useUser } from '@/contexts/UserContext';
import { ProfileFormData } from '../types';
import { styles } from '../../ChangePassword/styles';
import { TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';

export const useEditProfile = () => {
  const navigation = useNavigation();
  const { profile, updateProfile } = useProfile();
  const { user, updateUser } = useUser();
  const [saving, setSaving] = useState(false);
  
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
            <Text style={styles.saveButtom}>Save</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, saving]);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        company: profile.company || '',
        role: profile.role || '',
        bio: profile.bio || '',
        linkedIn: profile.linkedIn || '',
        website: profile.website || '',
        avatar: profile.avatar || null,
      });
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        role: user.role || '',
      }));
    }
  }, []);

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
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        role: formData.role,
        bio: formData.bio,
        linkedIn: formData.linkedIn,
        website: formData.website,
        avatar: formData.avatar,
      });

      if (user) {
        await updateUser({
          ...user,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          role: formData.role,
        });
      }
      
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

  const updateField = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return {
    formData,
    errors,
    saving,
    updateField,
    handleSave,
    setFormData,
  };
};
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useProfile } from '@/contexts/ProfileContext';
import { useUser } from '@/contexts/UserContext';
import { ProfileFormData } from '../types';

export const useEditProfile = () => {
  const { profile, updateProfile } = useProfile();
  const { user, updateUser } = useUser();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
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
  }, [profile, user]);

  const validateForm = useCallback((): boolean => {
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
  }, [formData]);

  const handleSave = useCallback(async () => {
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
      
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, updateProfile, user, updateUser]);

  const updateField = useCallback((field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  return {
    formData,
    errors,
    saving,
    updateField,
    handleSave,
    setFormData,
  };
};
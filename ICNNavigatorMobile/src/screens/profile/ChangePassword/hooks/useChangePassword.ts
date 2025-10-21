import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PasswordFormData, PasswordErrors, PasswordStrength, PasswordRequirement } from '../types';
import { Colors } from '../../../../constants/colors';

export const useChangePassword = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<PasswordErrors>({});

  // Password strength calculation
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    
    if (!password) return { score: 0, label: '', color: Colors.black20 };
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Determine strength label and color
    if (score <= 2) {
      return { score: 1, label: 'Weak', color: Colors.error };
    } else if (score <= 4) {
      return { score: 2, label: 'Fair', color: Colors.warning };
    } else if (score <= 5) {
      return { score: 3, label: 'Good', color: Colors.orange[200] };
    } else {
      return { score: 4, label: 'Strong', color: Colors.success };
    }
  };

  const passwordStrength = calculatePasswordStrength(formData.newPassword);

  // Password requirements check
  const passwordRequirements: PasswordRequirement[] = [
    { 
      met: formData.newPassword.length >= 8, 
      text: 'At least 8 characters' 
    },
    { 
      met: /[A-Z]/.test(formData.newPassword), 
      text: 'One uppercase letter' 
    },
    { 
      met: /[a-z]/.test(formData.newPassword), 
      text: 'One lowercase letter' 
    },
    { 
      met: /[0-9]/.test(formData.newPassword), 
      text: 'One number' 
    },
    { 
      met: /[^A-Za-z0-9]/.test(formData.newPassword), 
      text: 'One special character' 
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: PasswordErrors = {};

    // Current password validation
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    // New password validation
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement actual API call
      // await api.changePassword({
      //   currentPassword: formData.currentPassword,
      //   newPassword: formData.newPassword,
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Success',
        'Your password has been changed successfully. Please log in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              // Here you might want to sign out the user
            }
          }
        ]
      );
    } catch (error: any) {
      // Handle specific error cases
      if (error?.message?.includes('incorrect')) {
        setErrors({ currentPassword: 'Current password is incorrect' });
      } else {
        Alert.alert(
          'Error',
          'Failed to change password. Please try again later.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'We\'ll send you a password reset link to your registered email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Link', 
          onPress: () => {
            // TODO: Implement forgot password flow
            Alert.alert('Email Sent', 'Check your email for the reset link.');
          }
        }
      ]
    );
  };

  const updateFormData = (key: keyof PasswordFormData, value: string) => {
    setFormData({ ...formData, [key]: value });
    if (errors[key]) {
      setErrors({ ...errors, [key]: undefined });
    }
  };

  return {
    loading,
    formData,
    errors,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    passwordStrength,
    passwordRequirements,
    setShowCurrentPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    handleChangePassword,
    handleForgotPassword,
    updateFormData,
  };
};
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { PasswordHasher } from '../../utils/passwordHasher';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function ChangePasswordScreen() {
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
  const calculatePasswordStrength = (password: string): {
    score: number;
    label: string;
    color: string;
  } => {
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
  const passwordRequirements = [
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

    // New password format validation (must match backend requirements)
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!PasswordHasher.validatePassword(formData.newPassword)) {
      newErrors.newPassword = 'Password must be 6-20 characters long and contain only letters, numbers, and underscores (_)';
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

  const renderPasswordInput = (
    label: string,
    key: keyof PasswordFormData,
    placeholder: string,
    showPassword: boolean,
    toggleShowPassword: () => void
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={[
            styles.passwordInput,
            errors[key] && styles.inputError,
          ]}
          value={formData[key]}
          onChangeText={(text) => {
            setFormData({ ...formData, [key]: text });
            if (errors[key]) {
              setErrors({ ...errors, [key]: undefined });
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={Colors.black50}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={toggleShowPassword}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="rgba(27, 62, 111, 0.6)"
          />
        </TouchableOpacity>
      </View>
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
          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#1B3E6F" />
            <Text style={styles.securityText}>
              For your security, we'll sign you out after changing your password
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Current Password */}
            {renderPasswordInput(
              'Current Password',
              'currentPassword',
              'Enter current password',
              showCurrentPassword,
              () => setShowCurrentPassword(!showCurrentPassword)
            )}

            {/* New Password */}
            {renderPasswordInput(
              'New Password',
              'newPassword',
              'Enter new password',
              showNewPassword,
              () => setShowNewPassword(!showNewPassword)
            )}

            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthLabel}>Password Strength:</Text>
                  <Text style={[styles.strengthValue, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
                <View style={styles.strengthBar}>
                  {[1, 2, 3, 4].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthSegment,
                        {
                          backgroundColor: level <= passwordStrength.score
                            ? passwordStrength.color
                            : Colors.black20,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Confirm Password */}
            {renderPasswordInput(
              'Confirm New Password',
              'confirmPassword',
              'Confirm new password',
              showConfirmPassword,
              () => setShowConfirmPassword(!showConfirmPassword)
            )}

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              {passwordRequirements.map((req, index) => (
                <View key={index} style={styles.requirementRow}>
                  <Ionicons
                    name={req.met ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={req.met ? Colors.success : Colors.black50}
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      req.met && styles.requirementMet,
                    ]}
                  >
                    {req.text}
                  </Text>
                </View>
              ))}
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => {
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
              }}
            >
              <Text style={styles.forgotText}>Forgot your current password?</Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.white} />
                  <Text style={styles.submitButtonText}>Change Password</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Additional Security Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Security Tips:</Text>
              <View style={styles.tipRow}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  Use a unique password that you don't use elsewhere
                </Text>
              </View>
              <View style={styles.tipRow}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  Consider using a password manager
                </Text>
              </View>
              <View style={styles.tipRow}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  Enable two-factor authentication for extra security
                </Text>
              </View>
            </View>
          </View>
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
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent like ProfileScreen
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12, // Match SubscriptionCard radius
    gap: 12,
    shadowColor: '#000', // Match ProfileScreen shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(27, 62, 111, 0.85)', // Match ProfileScreen text color
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent like ProfileScreen
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12, // Match SubscriptionCard radius
    padding: 20, // Match ProfileScreen padding
    shadowColor: '#000', // Match ProfileScreen shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(27, 62, 111, 0.85)', // Match ProfileScreen setting title color
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(27, 62, 111, 0.2)', // Subtle blue border
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent input background
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: 'rgba(27, 62, 111, 0.9)', // Match ProfileScreen text color
  },
  inputError: {
    borderColor: Colors.error,
  },
  eyeButton: {
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  strengthContainer: {
    marginTop: -12,
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent background
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(27, 62, 111, 0.1)', // Subtle border
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 13,
    color: 'rgba(27, 62, 111, 0.85)', // Match ProfileScreen text color
  },
  strengthValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  strengthBar: {
    flexDirection: 'row',
    height: 4,
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  requirementsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent background
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(27, 62, 111, 0.1)', // Subtle border
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(27, 62, 111, 0.85)', // Match ProfileScreen text color
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: 'rgba(27, 62, 111, 0.6)', // Match ProfileScreen secondary text color
  },
  requirementMet: {
    color: 'rgba(27, 62, 111, 0.85)', // Match ProfileScreen text color
    fontWeight: '500',
  },
  forgotButton: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    color: '#1B3E6F', // Match ProfileScreen button color
    textDecorationLine: 'underline',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B3E6F', // Match ProfileScreen button color
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent background
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(27, 62, 111, 0.1)', // Subtle border
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(27, 62, 111, 0.85)', // Match ProfileScreen text color
    marginBottom: 8,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tipBullet: {
    fontSize: 12,
    color: 'rgba(27, 62, 111, 0.6)', // Match ProfileScreen secondary text color
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(27, 62, 111, 0.6)', // Match ProfileScreen secondary text color
    lineHeight: 16,
  },
});
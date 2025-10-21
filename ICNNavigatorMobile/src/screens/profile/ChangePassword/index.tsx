import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useChangePassword } from './hooks/useChangePassword';
import { PasswordInput } from './components/PasswordInput';
import { PasswordStrength } from './components/PasswordStrength';
import { PasswordRequirements } from './components/PasswordRequirements';
import { SecurityTips } from './components/SecurityTips';
import { styles } from './styles';
import { Colors } from '@/constants/colors';

export default function ChangePasswordScreen() {
  const {
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
  } = useChangePassword();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Background Logo */}
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
            <PasswordInput
              label="Current Password"
              value={formData.currentPassword}
              error={errors.currentPassword}
              placeholder="Enter current password"
              showPassword={showCurrentPassword}
              onChangeText={(text) => updateFormData('currentPassword', text)}
              onToggleVisibility={() => setShowCurrentPassword(!showCurrentPassword)}
            />

            {/* New Password */}
            <PasswordInput
              label="New Password"
              value={formData.newPassword}
              error={errors.newPassword}
              placeholder="Enter new password"
              showPassword={showNewPassword}
              onChangeText={(text) => updateFormData('newPassword', text)}
              onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
            />

            {/* Password Strength Indicator */}
            <PasswordStrength strength={passwordStrength} />

            {/* Confirm Password */}
            <PasswordInput
              label="Confirm New Password"
              value={formData.confirmPassword}
              error={errors.confirmPassword}
              placeholder="Confirm new password"
              showPassword={showConfirmPassword}
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            {/* Password Requirements */}
            <PasswordRequirements requirements={passwordRequirements} />

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={handleForgotPassword}
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

            {/* Security Tips */}
            <SecurityTips />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
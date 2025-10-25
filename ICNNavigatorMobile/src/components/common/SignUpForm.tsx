import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../contexts/UserContext';
import AuthService from '../../services/authService';
import { PasswordHasher } from '../../utils/passwordHasher';

interface SignUpFormProps {
  onAlreadyHaveAccount: () => void;
}

export default function SignUpForm({ onAlreadyHaveAccount }: SignUpFormProps) {
  const { login, setShowOnboarding } = useUser();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Refs for input field navigation
  const emailInputRef = useRef<TextInput>(null);
  const verificationCodeInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  // Countdown effect
  useEffect(() => {
    if (isCountingDown && countdown > 0) {
      countdownTimer.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && isCountingDown) {
      setIsCountingDown(false);
    }

    return () => {
      if (countdownTimer.current) {
        clearTimeout(countdownTimer.current);
      }
    };
  }, [countdown, isCountingDown]);

  // Clean up timer when component unmounts
  useEffect(() => {
    return () => {
      if (countdownTimer.current) {
        clearTimeout(countdownTimer.current);
      }
    };
  }, []);

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      await AuthService.sendValidationCode(email);
      setIsCountingDown(true);
      setCountdown(60);
      Alert.alert('Success', 'Verification code sent to your email');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    }
  };

  const handleSignUp = async () => {
    if (submitting) return;

    // Validate user name - minimum 2 characters
    if (!userName || userName.trim().length < 2) {
      Alert.alert('Error', 'User name must be at least 2 characters long');
      return;
    }

    // Validate name pattern (letters, numbers, spaces only)
    const namePattern = /^[a-zA-Z0-9\s]{2,50}$/;
    if (!namePattern.test(userName.trim())) {
      Alert.alert('Error', 'User name can only contain letters, numbers, and spaces');
      return;
    }

    // Validate email
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate password format before hashing
    if (!PasswordHasher.validatePassword(password)) {
      Alert.alert('Invalid Password', 'Password must be 6-20 characters long and contain only letters, numbers, and underscores (_)');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Validate verification code
    if (verificationCode.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-character verification code');
      return;
    }

    setSubmitting(true);
    try {
      // Register user - phone will be omitted if empty
      await AuthService.register({
        email: email.trim(),
        name: userName.trim(),
        password,
        code: verificationCode.trim().toUpperCase(), // Normalize code to uppercase
        phone: '', // Will be omitted by userApiService if empty
      });

      // After successful registration, log in
      await login(email, password);
      
      // Clear onboarding flag for new registrations
      await AsyncStorage.removeItem('@onboarding_completed');
      
      // Force show onboarding for new users
      setShowOnboarding(true);
      
      console.log('User registered and logged in successfully');
    } catch (e: any) {
      // Now shows detailed error from backend
      Alert.alert('Registration Failed', e.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <View style={styles.container}>
      {/* User Name Input */}
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <MaterialIcons name="person" size={16} color="#333" style={styles.icon} />
          <Text style={styles.label}>User Name</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="e.g. John Smith (min 2 characters)"
          placeholderTextColor="#999"
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailInputRef.current?.focus()}
          blurOnSubmit={false}
        />
      </View>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <MaterialIcons name="email" size={16} color="#333" style={styles.icon} />
          <Text style={styles.label}>Email</Text>
        </View>
        <TextInput
          ref={emailInputRef}
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => verificationCodeInputRef.current?.focus()}
          blurOnSubmit={false}
        />
      </View>

      {/* Email Verification Section */}
      <View style={styles.verificationSection}>
        <Text style={styles.verificationLabel}>Email Verification</Text>
        
        <View style={styles.verificationContainer}>
          <TextInput
            ref={verificationCodeInputRef}
            style={styles.verificationInput}
            placeholder="4-character code"
            placeholderTextColor="#999"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="default"
            maxLength={4}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            blurOnSubmit={false}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              isCountingDown && styles.disabledButton
            ]} 
            onPress={handleSendCode}
            disabled={isCountingDown}
          >
            <Text style={[
              styles.sendButtonText, 
              isCountingDown && styles.disabledButtonText
            ]}>
              {isCountingDown ? `${countdown}s` : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <MaterialIcons name="lock" size={16} color="#333" style={styles.icon} />
          <Text style={styles.label}>Password</Text>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            ref={passwordInputRef}
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={togglePasswordVisibility}
          >
            <MaterialIcons 
              name={showPassword ? "visibility" : "visibility-off"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password Input */}
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <MaterialIcons name="lock" size={16} color="#333" style={styles.icon} />
          <Text style={styles.label}>Confirm Password</Text>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            ref={confirmPasswordInputRef}
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={toggleConfirmPasswordVisibility}
          >
            <MaterialIcons 
              name={showConfirmPassword ? "visibility" : "visibility-off"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
        <Text style={styles.signUpButtonText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Already have account link */}
      <View style={styles.loginLinkContainer}>
        <Text style={styles.loginLinkText}>Already have a account? </Text>
        <TouchableOpacity onPress={onAlreadyHaveAccount}>
          <Text style={styles.loginLink}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    paddingRight: 15,
  },
  signUpButton: {
    backgroundColor: '#1B3E6F',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#0A6FA3',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  verificationSection: {
    marginBottom: 20,
  },
  verificationLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verificationInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sendButton: {
    backgroundColor: '#1B3E6F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0.05,
    elevation: 1,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButtonText: {
    color: '#999999',
  },
});

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordEyeOpacity] = useState(new Animated.Value(1));
  const [confirmEyeOpacity] = useState(new Animated.Value(1));
  const [sendButtonPressed, setSendButtonPressed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  // Countdown effect
  useEffect(() => {
    if (isCountingDown && countdown > 0) {
      countdownTimer.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && isCountingDown) {
      setIsCountingDown(false);
      setVerificationSent(false); // Reset send state, allow sending again
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

  const handleSendVerification = () => {
    // Handle sending verification email logic
    console.log('Send verification to:', email);
    setVerificationSent(true);
    
    // Start 60-second countdown
    setIsCountingDown(true);
    setCountdown(60);
  };

  const handleConfirmReset = () => {
    // Validate verification code
    if (!verificationCode || verificationCode.length < 6) {
      alert('Please enter a valid 6-digit verification code');
      return;
    }
    
    // Handle confirm reset password logic
    console.log('Reset password with:', { 
      email, 
      verificationCode, 
      password, 
      confirmPassword 
    });
  };

  const togglePasswordVisibility = () => {
    Animated.timing(passwordEyeOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowPassword(!showPassword);
      Animated.timing(passwordEyeOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const toggleConfirmPasswordVisibility = () => {
    Animated.timing(confirmEyeOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowConfirmPassword(!showConfirmPassword);
      Animated.timing(confirmEyeOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Reset your password</Text>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <MaterialIcons name="email" size={16} color="#333" style={styles.icon} />
          <Text style={styles.label}>Email</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Email Verification Section */}
      <View style={styles.verificationSection}>
        <Text style={styles.verificationLabel}>Email Verification</Text>
        
        <View style={styles.verificationContainer}>
          <TextInput
            style={styles.verificationInput}
            placeholder="Verification Code"
            placeholderTextColor="#999"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              isCountingDown && styles.disabledButton,
              sendButtonPressed && !isCountingDown && styles.sendButtonPressed
            ]} 
            onPress={handleSendVerification}
            onPressIn={() => !isCountingDown && setSendButtonPressed(true)}
            onPressOut={() => setSendButtonPressed(false)}
            disabled={isCountingDown}
            activeOpacity={1}
            accessibilityRole="button"
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
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={togglePasswordVisibility}
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
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
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={toggleConfirmPasswordVisibility}
            accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            <MaterialIcons 
              name={showConfirmPassword ? "visibility" : "visibility-off"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmReset} accessibilityRole="button">
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
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
    backgroundColor: '#1B3E6F', // Unified blue background
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    // Add shadow effect
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonPressed: {
    backgroundColor: '#888888', // Gray when pressed
    shadowOpacity: 0.05, // Reduce shadow
    elevation: 1,
    transform: [{ scale: 0.98 }], // Slight scale down effect
  },
  disabledButton: {
    backgroundColor: '#CCCCCC', // Gray during countdown
    shadowOpacity: 0.05,
    elevation: 1,
  },
  sentButton: {
    backgroundColor: '#28A745', // Green after successful send
  },
  sendButtonText: {
    color: '#FFFFFF', // White text
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButtonText: {
    color: '#999999', // Dark gray text during countdown
  },
  sentButtonText: {
    color: '#FFFFFF',
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
  confirmButton: {
    backgroundColor: '#1B3E6F',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useUser } from '../../contexts/UserContext';

interface SignUpFormProps {
  onAlreadyHaveAccount: () => void;
}

export default function SignUpForm({ onAlreadyHaveAccount }: SignUpFormProps) {
  const { login } = useUser();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // References for input field navigation
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleSignUp = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // TODO: validate and call real register API if available
      // After a successful register, authenticate so AppNavigator switches to Main:
      await login(email || 'newuser@example.com', password || 'password'); // works with your mock auth
      // No need to manually navigate; AppNavigator will render MainNavigator.
    } catch (e) {
      console.log('Sign up failed:', e);
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
          placeholder="e.g. JohnSmith11"
          placeholderTextColor="#999"
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="none"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => emailRef.current?.focus()}
        />
      </View>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <MaterialIcons name="email" size={16} color="#333" style={styles.icon} />
          <Text style={styles.label}>Email</Text>
        </View>
        <TextInput
          ref={emailRef}
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <MaterialIcons name="lock" size={16} color="#333" style={styles.icon} />
          <Text style={styles.label}>Password</Text>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            ref={passwordRef}
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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
            ref={confirmPasswordRef}
            style={styles.passwordInput}
            placeholder="Confirm your password"
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
    paddingBottom: 20, // extra bottom padding to accommodate the keyboard
  },
  inputContainer: {
    marginBottom: 18, // increased spacing between input fields
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
    marginTop: 25, // increased top spacing for the button
    marginBottom: 25, // increased bottom spacing for the button
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
});

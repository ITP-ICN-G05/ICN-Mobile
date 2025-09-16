import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';

interface SignInFormProps {
  onForgotPassword: () => void;
}

export default function SignInForm({ onForgotPassword }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = () => {
    // Handle sign in logic
    console.log('Sign in with:', { email, password });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.container}>
      {/* Email Input */}
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <Image source={require('../../../assets/icons/Mail.png')} style={styles.icon} />
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

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <Image source={require('../../../assets/icons/Lock.png')} style={styles.icon} />
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
          >
            <Image 
              source={showPassword 
                ? require('../../../assets/icons/Eye.png') 
                : require('../../../assets/icons/EyeHide.png')
              } 
              style={styles.eyeIconImage} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
        <Text style={styles.signInButtonText}>Sign In</Text>
      </TouchableOpacity>

      {/* Forgot Password Link */}
      <TouchableOpacity onPress={onForgotPassword} style={styles.forgotPasswordContainer}>
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
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
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#333',
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
  eyeIconImage: {
    width: 20,
    height: 20,
    tintColor: '#666',
  },
  signInButton: {
    backgroundColor: '#1B3E6F',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#0A6FA3',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

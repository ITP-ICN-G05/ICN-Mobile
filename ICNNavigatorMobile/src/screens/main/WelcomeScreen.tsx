import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  // Keep these if you use them elsewhere; they no longer drive a fade-out
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goSignup = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    navigation.replace('LoginSignUp', { mode: 'signup' });
  };

  const goLogin = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    navigation.replace('LoginSignUp', { mode: 'login' });
  };

  return (
    <Animated.View
      pointerEvents={isTransitioning ? 'none' : 'auto'}
      style={[styles.container, { opacity: fadeAnim }]}
    >
      <StatusBar style="light" />

      {/* Top section */}
      <View style={styles.topSection}>
        {/* ICN Logo */}
        <View style={styles.logoContainer} pointerEvents="none">
          <Image
            source={require('../../../assets/ICN Logo Source/ICN-logo-little.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* App title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>ICN Navigator</Text>
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.getStartedButton,
            isButtonPressed && styles.getStartedButtonPressed,
            isTransitioning && styles.getStartedButtonNoShadow,
          ]}
          onPress={goSignup}
          onPressIn={() => setIsButtonPressed(true)}
          onPressOut={() => setIsButtonPressed(false)}
          activeOpacity={1}
          disabled={isTransitioning}
        >
          <Text style={styles.getStartedText}>Get Started Free  →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInButton}
          onPress={goLogin}
          disabled={isTransitioning}
        >
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.white 
  },
  topSection: { 
    flex: 2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 60
  },
  middleSection: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 40 
  },
  bottomSection: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 40, 
    paddingBottom: 50,
    backgroundColor: '#F7B85C',
  },
  logoContainer: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: -30,
    marginRight: -250,
  },
  logo: { 
    width: 600, 
    height: 600, 
    transform: [{ rotate: '180deg' }]
  },
  titleContainer: { 
    alignSelf: 'flex-start', 
    alignItems: 'flex-start', 
    marginLeft: 5, 
    marginBottom: 5 
  },
  title: { 
    fontSize: 16, 
    fontWeight: '300', 
    color: Colors.black80, 
    textAlign: 'left' 
  },
  subtitle: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: Colors.white, 
    textAlign: 'center', 
    marginBottom: 16 
  },
  description: { 
    fontSize: 16, 
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center', 
    lineHeight: 24 
  },
  getStartedButton: {
    backgroundColor: '#FFF4D6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedButtonPressed: {
    backgroundColor: '#F0E4B6',
    shadowOpacity: 0,
    elevation: 0,
    shadowRadius: 0,
  },
  getStartedButtonNoShadow: {
    shadowOpacity: 0,
    elevation: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  getStartedText: { 
    color: Colors.black80, 
    fontSize: 16, 
    fontWeight: '500', 
    textAlign: 'center' 
  },
  signInButton: {
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  signInText: { 
    color: Colors.black80, 
    fontSize: 16, 
    textAlign: 'center' 
  },
  signInLink: { 
    color: '#4A90E2', 
    textDecorationLine: 'underline', 
    fontWeight: '500' 
  },
});

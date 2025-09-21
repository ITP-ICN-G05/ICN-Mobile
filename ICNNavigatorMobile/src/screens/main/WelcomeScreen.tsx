import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing } from '../../constants/colors';
import { createPageTransitions, TransitionPresets } from '../../effects/pageTransitions';

export default function WelcomeScreen() {
  // Animation states
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));

  // Button pressed state
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  // Page transitioning state (to remove button shadow immediately, avoiding transition conflicts)
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Page loading state
  const [isLoading, setIsLoading] = useState(false);

  // Create page transitions instance
  const pageTransitions = createPageTransitions(fadeAnim, scaleAnim);

  // Navigation with effects function - now using extracted utility
  const navigateWithEffect = (effectType = 'fade') => {
    // Reset button state immediately to prevent shadow pollution
    setIsButtonPressed(false);
    setIsTransitioning(true);

    // Let shadow removal style render first, then start transition
    requestAnimationFrame(() => {
      const transitionConfig = {
        ...TransitionPresets.quick, // Use quick preset, can be changed to standard or slow
        onTransitionStart: () => {
          // Transition started
        },
        onLoadingStart: () => {
          setIsLoading(true);
        },
        onLoadingEnd: () => {
          setIsLoading(false);
        },
        onTransitionComplete: () => {
          setIsButtonPressed(false);
          setIsTransitioning(false);
        }
      };

      switch (effectType) {
        case 'fade':
          pageTransitions.fadeTransition(transitionConfig);
          break;
        case 'scale':
          pageTransitions.scaleTransition(transitionConfig);
          break;
        default:
          // No effect navigation
          break;
      }
    });
  };

  const handleGetStarted = () => {
    // Reset button state immediately to prevent dark effect pollution during fade
    setIsButtonPressed(false);
    setIsTransitioning(true);
    navigateWithEffect('fade'); // Use fade transition effect
  };

  const handleSignIn = () => {
    setIsTransitioning(true);
    navigateWithEffect('fade'); // Use same fade transition as Get Started
  };

      return (
    <Animated.View style={[
      styles.container,
      pageTransitions.getAnimatedStyle() // Use extracted animation styles
    ]}>
      <StatusBar style="light" />


      {/* Top section */}
      <View style={styles.topSection}>
        {/* ICN Logo component */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/ICN Logo Source/ICN-logo-little.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

      </View>

      {/* ICN Name component - positioned at top left outside bottom section */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>ICN Navigator</Text>
      </View>

      {/* Bottom button section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={[
            styles.getStartedButton,
            isButtonPressed && styles.getStartedButtonPressed, // Dark style when pressed
            isTransitioning && styles.getStartedButtonNoShadow // Transitioning: remove shadow only
          ]} 
          onPress={handleGetStarted}
          onPressIn={() => setIsButtonPressed(true)}   // When pressed
          onPressOut={() => setIsButtonPressed(false)} // When released
          activeOpacity={1}  // Prevent opacity change
        >
          <Text style={styles.getStartedText}>Get Started Free  →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>

        {/* Loading indicator - overlay only, no text */}
        {isLoading && (<View style={styles.loadingOverlay} />)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white, // Use project standard white color
  },
  topSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
    backgroundColor: '#F7B85C', // Custom orange-yellow color
  },
  logoContainer: {
    // Logo container styles - align to screen right edge
    alignSelf: 'flex-end',       // Align entire container to right
    alignItems: 'center',        // Center content inside container
    marginBottom: Spacing.md,    // Distance from components below
    marginTop: -30,              // Distance from top
    marginRight: -250,           // Distance from right edge (adjustable)
    // Logo will now display on screen right side
  },
  logo: {
    width: 600,
    height: 600,
    // Rotation control
    transform: [
      { rotate: '180deg' }  // Rotate 180 degrees (adjustable angle)
    ],
  },
  titleContainer: {
    // Title container styles - positioned at top left of bottom section
    alignSelf: 'flex-start',     // Left align
    alignItems: 'flex-start',    // Align content to left
    marginLeft: 5,               // Distance from left edge
    marginBottom: 5,             // Distance from bottom section
    // Text will now display at top left outside bottom section
  },
  title: {
    fontSize: 16,                // Keep 16px font size
    fontWeight: '300',           // Changed from 'bold' to '300' (thinner font)
    color: Colors.black80,       // Changed from pure black to slightly gray black (#333333)
    textAlign: 'left',           // Changed to left align to match container alignment
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  getStartedButton: {
    backgroundColor: '#FFF4D6',      // Light yellow background, similar to image color
    paddingHorizontal: 32,           // Adjust horizontal padding
    paddingVertical: 14,             // Adjust vertical padding
    borderRadius: 8,                 // Border radius control: 8=more square, 12=medium, 16=rounder, 20=very round
    marginBottom: 20,
    minWidth: 200,
    // Enhanced shadow effect
    shadowColor: '#000',
    shadowOffset: {
      width: 0,                      // Horizontal offset: 0=center, positive=right, negative=left
      height: 10,                    // Vertical offset: larger value = shadow further down
    },
    shadowOpacity: 0.25,             // Shadow opacity: 0=no shadow, 1=completely opaque
    shadowRadius: 8,                 // Shadow blur radius: larger value = more blurred shadow
    elevation: 8,                    // Android shadow: 0-24, larger value = more prominent shadow
  },
  getStartedButtonPressed: {
    backgroundColor: '#F0E4B6',      // Darker version when pressed (slightly darker than original)
    shadowOpacity: 0,                // Completely remove shadow when pressed to prevent fade pollution
    elevation: 0,                    // Completely remove Android shadow when pressed
    shadowRadius: 0,                 // Remove shadow blur
  },
  getStartedButtonNoShadow: {
    // During page transition: only remove shadow, don't change background color
    shadowOpacity: 0,
    elevation: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  getStartedText: {
    color: Colors.black80,          // Keep consistent with ICN Navigator text color
    fontSize: 16,                   // Slightly smaller font
    fontWeight: '500',              // Medium font weight
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: 'transparent',
    position: 'absolute',            // Use absolute positioning
    bottom: 60,                      // Distance from bottom - you can adjust this value
    left: 0,
    right: 0,                        // Make button span entire width
    alignItems: 'center',            // Center align text
  },
  signInText: {
    color: Colors.black80,           // Keep consistent color with other text
    fontSize: 16,
    textAlign: 'center',
  },
  signInLink: {
    color: '#4A90E2',                // Blue link color
    textDecorationLine: 'underline', // Underline
    fontWeight: '500',               // Slightly bold
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent black background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,                    // Ensure it's on top layer
  },
  loadingText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '500',
  },
});
	
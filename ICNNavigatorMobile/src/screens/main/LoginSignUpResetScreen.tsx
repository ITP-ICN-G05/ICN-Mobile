import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform, Keyboard, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AuthContainer from '../../components/common/AuthContainer';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type ScreenRoute = RouteProp<AuthStackParamList, 'LoginSignUp'>;
type AuthMode = 'login' | 'signup' | 'reset';

// Accept either `initialMode` or `mode` to cover both APIs
const AuthContainerCompat = AuthContainer as React.ComponentType<{
  initialMode?: AuthMode;
  mode?: AuthMode;
}>;

export default function LoginSignUpResetScreen() {
  const { params } = useRoute<ScreenRoute>();
  const mode: AuthMode = params?.mode ?? 'login';
  
  // Animated value for smooth form movement when keyboard appears/disappears
  const formTranslateY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Keyboard event listeners for smooth form animation
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        // Move form up when keyboard appears to ensure all fields are visible
        const keyboardHeight = event.endCoordinates.height;
        const moveUpDistance = Platform.OS === 'ios' ? -keyboardHeight * 0.3 : -50;
        
        Animated.timing(formTranslateY, {
          toValue: moveUpDistance,
          duration: Platform.OS === 'ios' ? event.duration : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        // Return form to original position when keyboard disappears
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? event.duration : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    // Cleanup listeners on component unmount
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [formTranslateY]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar style="light" />

      <Image
        source={require('../../../assets/ICN Logo Source/ICN-logo-little.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
        onError={(error) => console.log('Background image load error:', error)}
      />

      <Image
        source={require('../../../assets/ICN Logo Source/ICN-logo-full2.png')}
        style={styles.topLogo}
        resizeMode="contain"
        onError={(error) => console.log('Top logo load error:', error)}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Animated.View 
          style={[
            styles.authWrapper,
            {
              transform: [{ translateY: formTranslateY }]
            }
          ]}
        >
          {/* Force remount when mode changes and support either prop name */}
          <AuthContainerCompat key={mode} initialMode={mode} mode={mode} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7B85C' },
  backgroundImage: {
    position: 'absolute',
    top: 150,
    left: -100,
    right: 0,
    bottom: 0,
    width: 530,
    height: 530,
    opacity: 0.6,
  },
  topLogo: {
    position: 'absolute',
    top: 30,
    left: 30,
    width: 200,
    height: 80,
    zIndex: 1,
    opacity: 0.8,
  },
  scrollContainer: { flex: 1, marginTop: 120 },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingBottom: 50,
    paddingTop: 20,
  },
  authWrapper: { 
    flex: 1, 
    justifyContent: 'center', 
    minHeight: 500,
    paddingHorizontal: 10,
  },
});

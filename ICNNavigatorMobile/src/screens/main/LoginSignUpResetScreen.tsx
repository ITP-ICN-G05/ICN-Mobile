import React from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
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

  return (
    <View style={styles.container}>
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
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.authWrapper}>
          {/* Force remount when mode changes and support either prop name */}
          <AuthContainerCompat key={mode} initialMode={mode} mode={mode} />
        </View>
      </ScrollView>
    </View>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 50 },
  authWrapper: { flex: 1, justifyContent: 'center', minHeight: 500 },
});

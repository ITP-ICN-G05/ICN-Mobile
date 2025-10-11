import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import ResetPasswordForm from './ResetPasswordForm';

type InternalMode = 'signin' | 'signup' | 'reset';
type AuthModeProp = 'login' | 'signin' | 'signup' | 'reset';

type Props = {
  /** Optional: read-once default mode */
  initialMode?: AuthModeProp;
  /** Optional: controlled mode from navigation params */
  mode?: AuthModeProp;
};

function normalizeMode(m?: AuthModeProp): InternalMode {
  if (m === 'signup') return 'signup';
  if (m === 'reset') return 'reset';
  // Treat both 'login' and 'signin' as 'signin'
  return 'signin';
}

export default function AuthContainer({ initialMode = 'signin', mode }: Props) {
  const startMode = useMemo(() => normalizeMode(mode ?? initialMode), [mode, initialMode]);
  const [currentMode, setCurrentMode] = useState<InternalMode>(startMode);

  // Keep in sync if parent controls `mode`
  useEffect(() => {
    setCurrentMode(startMode);
  }, [startMode]);

  const handleForgotPassword = () => setCurrentMode('reset');
  const handleAlreadyHaveAccount = () => setCurrentMode('signin');

  const renderTabButtons = () => {
    if (currentMode === 'reset') return null;

    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            styles.leftTab,
            currentMode === 'signin' && styles.activeTab,
          ]}
          onPress={() => setCurrentMode('signin')}
        >
          <Text
            style={[styles.tabText, currentMode === 'signin' && styles.activeTabText]}
          >
            Sign In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            styles.rightTab,
            currentMode === 'signup' && styles.activeTab,
          ]}
          onPress={() => setCurrentMode('signup')}
        >
          <Text
            style={[styles.tabText, currentMode === 'signup' && styles.activeTabText]}
          >
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCurrentForm = () => {
    switch (currentMode) {
      case 'signup':
        return <SignUpForm onAlreadyHaveAccount={handleAlreadyHaveAccount} />;
      case 'reset':
        return <ResetPasswordForm />;
      case 'signin':
      default:
        return <SignInForm onForgotPassword={handleForgotPassword} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderTabButtons()}

      <View style={styles.formContainer}>{renderCurrentForm()}</View>

      {currentMode === 'reset' && (
        <TouchableOpacity
          style={styles.backToSignInContainer}
          onPress={() => setCurrentMode('signin')}
        >
          <Text style={styles.backToSignInText}>← Back to Sign In</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 25, // slightly reduce vertical padding
    paddingHorizontal: 10,
    marginHorizontal: 20,
    marginBottom: 20, // add bottom margin to leave space for the keyboard
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    marginHorizontal: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  leftTab: { 
    marginRight: 2 
  },
  rightTab: {
    marginLeft: 2 
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#333',
    fontWeight: '600',
  },
  formContainer: {
    minHeight: 300,
    paddingBottom: 10, // 为表单底部添加额外间距
  },
  backToSignInContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  backToSignInText: {
    color: '#0A6FA3',
    fontSize: 14,
    fontWeight: '500',
  },
});

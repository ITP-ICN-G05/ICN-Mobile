import React, { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { Colors } from '../constants/colors';

/**
 * AuthGate waits for user authentication state to be determined
 * before rendering children components
 */
interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { isLoading } = useUser();
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
};

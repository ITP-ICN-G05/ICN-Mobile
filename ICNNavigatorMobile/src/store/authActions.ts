import { Dispatch } from '@reduxjs/toolkit';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction } from './authSlice';
import { clearUserProfile, setUserProfile } from './userSlice';
import { clearSubscription } from './subscriptionSlice';
// Import your auth service here
// import { authService } from '../services/authService';

export const login = (email: string, password: string) => async (dispatch: Dispatch) => {
  try {
    dispatch(loginStart());
    
    // Replace with your actual auth service call
    // const response = await authService.login(email, password);
    
    // Simulated response
    const response = {
      token: 'fake-jwt-token',
      refreshToken: 'fake-refresh-token',
      user: {
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe',
      }
    };
    
    dispatch(loginSuccess({
      token: response.token,
      refreshToken: response.refreshToken,
    }));
    
    dispatch(setUserProfile({
      id: response.user.id,
      email: response.user.email,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
    }));
    
    // Store tokens in secure storage
    // await SecureStore.setItemAsync('token', response.token);
    // await SecureStore.setItemAsync('refreshToken', response.refreshToken);
    
  } catch (error: any) {
    dispatch(loginFailure(error.message || 'Login failed'));
  }
};

export const logout = () => async (dispatch: Dispatch) => {
  try {
    // Clear tokens from secure storage
    // await SecureStore.deleteItemAsync('token');
    // await SecureStore.deleteItemAsync('refreshToken');
    
    // Clear all state
    dispatch(logoutAction());
    dispatch(clearUserProfile());
    dispatch(clearSubscription());
    
  } catch (error) {
    console.error('Logout error:', error);
  }
};
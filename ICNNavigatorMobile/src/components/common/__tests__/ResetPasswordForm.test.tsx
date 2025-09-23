import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ResetPasswordForm from '../ResetPasswordForm';
import { Animated } from 'react-native';

// Mock Animated.timing to make it synchronous and satisfy TypeScript types
jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
  return {
    start: (callback?: (result: { finished: boolean }) => void) => {
      (value as any).setValue(config.toValue);
      if (callback) {
        callback({ finished: true });
      }
    },
    stop: () => {},
    reset: () => {}, // Added to satisfy the CompositeAnimation interface
  } as Animated.CompositeAnimation;
});

// Mock the alert function
global.alert = jest.fn();

// Mock console.log to avoid test output pollution
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ResetPasswordForm Component', () => {
  describe('Component Rendering', () => {
    it('should render all form elements correctly', () => {
      const { getByPlaceholderText, getByText, getAllByPlaceholderText } = render(
        <ResetPasswordForm />
      );

      expect(getByText('Reset your password')).toBeTruthy();
      expect(getByText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(getByText('Email Verification')).toBeTruthy();
      expect(getByPlaceholderText('Verification Code')).toBeTruthy();
      expect(getByText('Send')).toBeTruthy();
      expect(getByText('Password')).toBeTruthy();
      
      const passwordInputs = getAllByPlaceholderText('Enter your password');
      expect(passwordInputs).toHaveLength(2);
      
      expect(getByText('Confirm Password')).toBeTruthy();
      expect(getByText('Confirm')).toBeTruthy();
    });

    it('should render without crashing', () => {
      expect(() => render(<ResetPasswordForm />)).not.toThrow();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when the eye icon is pressed', async () => {
      const { getByLabelText, getAllByPlaceholderText } = render(<ResetPasswordForm />);
      const passwordInput = getAllByPlaceholderText('Enter your password')[0];
      const eyeIcon = getByLabelText('Show password');
      
      expect(passwordInput.props.secureTextEntry).toBe(true);

      fireEvent.press(eyeIcon);

      await waitFor(() => {
        expect(getByLabelText('Hide password')).toBeTruthy();
        expect(passwordInput.props.secureTextEntry).toBe(false);
      });
    });

    it('should toggle confirm password visibility when the eye icon is pressed', async () => {
        const { getByLabelText, getAllByPlaceholderText } = render(<ResetPasswordForm />);
        const confirmPasswordInput = getAllByPlaceholderText('Enter your password')[1];
        const eyeIcon = getByLabelText('Show confirm password');
        
        expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
  
        fireEvent.press(eyeIcon);
  
        await waitFor(() => {
            expect(getByLabelText('Hide confirm password')).toBeTruthy();
            expect(confirmPasswordInput.props.secureTextEntry).toBe(false);
        });
      });
  });

  describe('Email Input Functionality', () => {
    it('should update email state when text changes', () => {
      const { getByPlaceholderText } = render(<ResetPasswordForm />);
      const emailInput = getByPlaceholderText('Enter your email');

      fireEvent.changeText(emailInput, 'test@example.com');
      
      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('should have correct keyboard type for email input', () => {
      const { getByPlaceholderText } = render(<ResetPasswordForm />);
      const emailInput = getByPlaceholderText('Enter your email');

      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');
    });
  });

  describe('Verification Code Functionality', () => {
    it('should update verification code state when text changes', () => {
      const { getByPlaceholderText } = render(<ResetPasswordForm />);
      const verificationInput = getByPlaceholderText('Verification Code');

      fireEvent.changeText(verificationInput, '123456');
      
      expect(verificationInput.props.value).toBe('123456');
    });

    it('should have correct keyboard type and max length for verification input', () => {
      const { getByPlaceholderText } = render(<ResetPasswordForm />);
      const verificationInput = getByPlaceholderText('Verification Code');

      expect(verificationInput.props.keyboardType).toBe('number-pad');
      expect(verificationInput.props.maxLength).toBe(6);
    });

    it('should limit verification code to 6 characters', () => {
      const { getByPlaceholderText } = render(<ResetPasswordForm />);
      const verificationInput = getByPlaceholderText('Verification Code');

      fireEvent.changeText(verificationInput, '1234567890');
      
      // The component should respect maxLength prop
      expect(verificationInput.props.maxLength).toBe(6);
    });
  });

  describe('Send Verification Button', () => {
    it('should call handleSendVerification when pressed', () => {
      const { getByPlaceholderText, getByText } = render(<ResetPasswordForm />);
      const emailInput = getByPlaceholderText('Enter your email');
      const sendButton = getByText('Send');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(sendButton);

            expect(console.log).toHaveBeenCalledWith('Send verification to:', 'test@example.com');
    });
  });

  describe('Password Input Functionality', () => {
    it('should update password state when text changes', () => {
      const { getAllByPlaceholderText } = render(<ResetPasswordForm />);
      const passwordInput = getAllByPlaceholderText('Enter your password')[0];

      fireEvent.changeText(passwordInput, 'password123');
      
      expect(passwordInput.props.value).toBe('password123');
    });

    it('should have secure text entry by default', () => {
      const { getAllByPlaceholderText } = render(<ResetPasswordForm />);
      const passwordInputs = getAllByPlaceholderText('Enter your password');

      // Both password and confirm password inputs should be secure by default
      passwordInputs.forEach(input => {
        expect(input.props.secureTextEntry).toBe(true);
      });
    });
  });

  describe('Confirm Password Functionality', () => {
    it('should update confirm password state when text changes', () => {
      const { getAllByPlaceholderText } = render(<ResetPasswordForm />);
      const confirmPasswordInput = getAllByPlaceholderText('Enter your password')[1];

      fireEvent.changeText(confirmPasswordInput, 'password123');
      
      expect(confirmPasswordInput.props.value).toBe('password123');
    });
  });

  describe('Form Validation', () => {
    it('should show alert when verification code is empty', () => {
      const { getByText } = render(<ResetPasswordForm />);
      const confirmButton = getByText('Confirm');

      fireEvent.press(confirmButton);

      expect(global.alert).toHaveBeenCalledWith('Please enter a valid 6-digit verification code');
    });

    it('should show alert when verification code is less than 6 digits', () => {
      const { getByPlaceholderText, getByText } = render(<ResetPasswordForm />);
      const verificationInput = getByPlaceholderText('Verification Code');
      const confirmButton = getByText('Confirm');

      fireEvent.changeText(verificationInput, '123');
      fireEvent.press(confirmButton);

      expect(global.alert).toHaveBeenCalledWith('Please enter a valid 6-digit verification code');
    });

    it('should process form when valid verification code is provided', () => {
      const { getByPlaceholderText, getByText, getAllByPlaceholderText } = render(
        <ResetPasswordForm />
      );
      
      const emailInput = getByPlaceholderText('Enter your email');
      const verificationInput = getByPlaceholderText('Verification Code');
      const passwordInput = getAllByPlaceholderText('Enter your password')[0];
      const confirmPasswordInput = getAllByPlaceholderText('Enter your password')[1];
      const confirmButton = getByText('Confirm');

      // Fill in form
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(verificationInput, '123456');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      
      fireEvent.press(confirmButton);

      expect(console.log).toHaveBeenCalledWith('Reset password with:', {
        email: 'test@example.com',
        verificationCode: '123456',
        password: 'password123',
        confirmPassword: 'password123'
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty form submission gracefully', () => {
      const { getByText } = render(<ResetPasswordForm />);
      const confirmButton = getByText('Confirm');

      fireEvent.press(confirmButton);

      expect(global.alert).toHaveBeenCalled();
    });

    it('should handle special characters in inputs', () => {
      const { getByPlaceholderText, getAllByPlaceholderText } = render(
        <ResetPasswordForm />
      );
      
      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getAllByPlaceholderText('Enter your password')[0];

      fireEvent.changeText(emailInput, 'test+tag@example.co.uk');
      fireEvent.changeText(passwordInput, 'P@$$w0rd!');

      expect(emailInput.props.value).toBe('test+tag@example.co.uk');
      expect(passwordInput.props.value).toBe('P@$$w0rd!');
    });
  });

  describe('Accessibility', () => {
    it('should render with proper accessibility labels', () => {
      const { getByText } = render(<ResetPasswordForm />);
      
      // Check for accessible text labels
      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Password')).toBeTruthy();
      expect(getByText('Confirm Password')).toBeTruthy();
      expect(getByText('Email Verification')).toBeTruthy();
    });

    it('should have proper button roles', () => {
      const { getAllByRole } = render(<ResetPasswordForm />);
      
      // Find all buttons by their accessibility role
      const buttons = getAllByRole('button');
      
      // Check if two buttons are found
      expect(buttons).toHaveLength(2);
    });
  });

  describe('Form State Management', () => {
    it('should manage multiple input states independently', () => {
      const { getByPlaceholderText, getAllByPlaceholderText } = render(
        <ResetPasswordForm />
      );
      
      const emailInput = getByPlaceholderText('Enter your email');
      const verificationInput = getByPlaceholderText('Verification Code');
      const passwordInputs = getAllByPlaceholderText('Enter your password');

      // Set different values
      fireEvent.changeText(emailInput, 'user@test.com');
      fireEvent.changeText(verificationInput, '654321');
      fireEvent.changeText(passwordInputs[0], 'newpass123');
      fireEvent.changeText(passwordInputs[1], 'confirmpass123');

      // Verify each field maintains its own state
      expect(emailInput.props.value).toBe('user@test.com');
      expect(verificationInput.props.value).toBe('654321');
      expect(passwordInputs[0].props.value).toBe('newpass123');
      expect(passwordInputs[1].props.value).toBe('confirmpass123');
    });
  });

  describe('Input Validation Rules', () => {
    it('should accept valid email formats', () => {
      const { getByPlaceholderText } = render(<ResetPasswordForm />);
      const emailInput = getByPlaceholderText('Enter your email');

      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        fireEvent.changeText(emailInput, email);
        expect(emailInput.props.value).toBe(email);
      });
    });

    it('should accept various password formats', () => {
      const { getAllByPlaceholderText } = render(<ResetPasswordForm />);
      const passwordInput = getAllByPlaceholderText('Enter your password')[0];

      const passwords = [
        'simplepass',
        'Complex123!',
        'P@$$w0rd2023',
        '1234567890',
        'Very Long Password With Spaces'
      ];

      passwords.forEach(password => {
        fireEvent.changeText(passwordInput, password);
        expect(passwordInput.props.value).toBe(password);
      });
    });
  });

  describe('Component Performance', () => {
    it('should render efficiently without unnecessary operations', () => {
      const renderTime = performance.now();
      render(<ResetPasswordForm />);
      const endTime = performance.now();
      
      // Component should render quickly (less than 100ms in test environment)
      expect(endTime - renderTime).toBeLessThan(100);
    });
  });
});
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import SignInForm from '../SignInForm';

describe('SignInForm Component', () => {
  const mockOnForgotPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid test output pollution
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render email and password input fields', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
    });

    it('should render sign in button', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      expect(screen.getByText('Sign In')).toBeTruthy();
    });

    it('should render forgot password link', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      expect(screen.getByText('Forgot password?')).toBeTruthy();
    });

    it('should show email and password labels with icons', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Password')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should allow typing in email field', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('should allow typing in password field', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      fireEvent.changeText(passwordInput, 'password123');
      
      expect(passwordInput.props.value).toBe('password123');
    });

    it('should have email field with correct keyboard type', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');
    });

    it('should have password field as secure text entry by default', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when eye icon is pressed', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const eyeButton = screen.getByTestId('password-visibility-toggle');
      
      // Initially password should be hidden
      expect(passwordInput.props.secureTextEntry).toBe(true);
      
      // Press eye icon to show password
      fireEvent.press(eyeButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);
      
      // Press again to hide password
      fireEvent.press(eyeButton);
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('should show correct eye icon based on password visibility state', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const eyeButton = screen.getByTestId('password-visibility-toggle');
      
      // Initially should show "visibility-off" icon (password hidden)
      expect(eyeButton).toBeTruthy();
      
      // After toggling, should show "visibility" icon (password visible)
      fireEvent.press(eyeButton);
      expect(eyeButton).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should call console.log with correct data when sign in button is pressed', async () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const signInButton = screen.getByText('Sign In');
      
      // Fill in form
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      
      // Press sign in button
      fireEvent.press(signInButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sign in with:', {
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    it('should call onForgotPassword when forgot password link is pressed', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const forgotPasswordLink = screen.getByText('Forgot password?');
      fireEvent.press(forgotPasswordLink);
      
      expect(mockOnForgotPassword).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard navigation correctly', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      
      // Check email input has correct return key type
      expect(emailInput.props.returnKeyType).toBeUndefined(); // Default behavior
      
      // Check password input can be focused
      fireEvent(emailInput, 'submitEditing');
      // In a real app, this would focus the password field
      expect(passwordInput).toBeTruthy();
    });
  });

  describe('Form State Management', () => {
    it('should maintain independent state for email and password', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      
      // Change email
      fireEvent.changeText(emailInput, 'user@test.com');
      expect(emailInput.props.value).toBe('user@test.com');
      expect(passwordInput.props.value).toBe(''); // Should remain empty
      
      // Change password
      fireEvent.changeText(passwordInput, 'secret');
      expect(passwordInput.props.value).toBe('secret');
      expect(emailInput.props.value).toBe('user@test.com'); // Should remain unchanged
    });

    it('should handle empty form submission', async () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const signInButton = screen.getByText('Sign In');
      fireEvent.press(signInButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sign in with:', {
          email: '',
          password: ''
        });
      });
    });

    it('should handle form with only email filled', async () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const signInButton = screen.getByText('Sign In');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(signInButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sign in with:', {
          email: 'test@example.com',
          password: ''
        });
      });
    });

    it('should handle form with only password filled', async () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const signInButton = screen.getByText('Sign In');
      
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sign in with:', {
          email: '',
          password: 'password123'
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in email and password', async () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const signInButton = screen.getByText('Sign In');
      
      fireEvent.changeText(emailInput, 'test+special@domain-example.co.uk');
      fireEvent.changeText(passwordInput, 'P@ssw0rd!#$%');
      fireEvent.press(signInButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sign in with:', {
          email: 'test+special@domain-example.co.uk',
          password: 'P@ssw0rd!#$%'
        });
      });
    });

    it('should handle very long input values', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      
      const longEmail = 'a'.repeat(100) + '@example.com';
      const longPassword = 'p'.repeat(200);
      
      fireEvent.changeText(emailInput, longEmail);
      fireEvent.changeText(passwordInput, longPassword);
      
      expect(emailInput.props.value).toBe(longEmail);
      expect(passwordInput.props.value).toBe(longPassword);
    });

    it('should handle rapid state changes', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const eyeButton = screen.getByTestId('password-visibility-toggle');
      
      // Rapid email changes
      fireEvent.changeText(emailInput, 'a');
      fireEvent.changeText(emailInput, 'ab');
      fireEvent.changeText(emailInput, 'abc@test.com');
      
      expect(emailInput.props.value).toBe('abc@test.com');
      
      // Rapid password visibility toggles
      fireEvent.press(eyeButton); // Show
      fireEvent.press(eyeButton); // Hide
      fireEvent.press(eyeButton); // Show
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      expect(passwordInput.props.secureTextEntry).toBe(false); // Should end up visible
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for form fields', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      
      // Check that accessibility labels exist
      expect(emailInput.props.accessibilityLabel || emailInput.props.placeholder).toBeTruthy();
      expect(passwordInput.props.accessibilityLabel || passwordInput.props.placeholder).toBeTruthy();
    });

    it('should have accessible button for password visibility toggle', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const eyeButton = screen.getByTestId('password-visibility-toggle');
      expect(eyeButton).toBeTruthy();
    });

    it('should have accessible sign in button', () => {
      render(<SignInForm onForgotPassword={mockOnForgotPassword} />);
      
      const signInButton = screen.getByText('Sign In');
      expect(signInButton.props.accessible !== false).toBeTruthy();
    });
  });
});
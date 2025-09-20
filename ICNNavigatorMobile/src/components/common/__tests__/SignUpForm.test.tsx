import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import SignUpForm from '../SignUpForm';

describe('SignUpForm Component', () => {
  const mockOnAlreadyHaveAccount = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid test output pollution
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all input fields', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      expect(screen.getByPlaceholderText('e.g. JohnSmith11')).toBeTruthy(); // Username
      expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy(); // Email
      expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy(); // Password
      expect(screen.getByPlaceholderText('Re-type your password')).toBeTruthy(); // Confirm Password
    });

    it('should render form labels with icons', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      expect(screen.getByText('User Name')).toBeTruthy();
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Password')).toBeTruthy();
      expect(screen.getByText('Confirm Password')).toBeTruthy();
    });

    it('should render sign up button', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      expect(screen.getByText('Sign Up')).toBeTruthy();
    });

    it('should render already have account link', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      expect(screen.getByText('Already have a account?')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should allow typing in username field', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g. JohnSmith11');
      fireEvent.changeText(usernameInput, 'TestUser123');
      
      expect(usernameInput.props.value).toBe('TestUser123');
    });

    it('should allow typing in email field', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('should allow typing in password field', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      fireEvent.changeText(passwordInput, 'password123');
      
      expect(passwordInput.props.value).toBe('password123');
    });

    it('should allow typing in confirm password field', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const confirmPasswordInput = screen.getByPlaceholderText('Re-type your password');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      
      expect(confirmPasswordInput.props.value).toBe('password123');
    });

    it('should have email field with correct keyboard type', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');
    });

    it('should have username field without auto capitalization', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g. JohnSmith11');
      expect(usernameInput.props.autoCapitalize).toBe('none');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when eye icon is pressed', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
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

    it('should toggle confirm password visibility independently', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const confirmPasswordInput = screen.getByPlaceholderText('Re-type your password');
      const confirmEyeButton = screen.getByTestId('confirm-password-visibility-toggle');
      
      // Initially confirm password should be hidden
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
      
      // Press eye icon to show confirm password
      fireEvent.press(confirmEyeButton);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(false);
      
      // Press again to hide confirm password
      fireEvent.press(confirmEyeButton);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
    });

    it('should handle both password visibility toggles independently', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Re-type your password');
      const passwordEyeButton = screen.getByTestId('password-visibility-toggle');
      const confirmEyeButton = screen.getByTestId('confirm-password-visibility-toggle');
      
      // Show password, keep confirm password hidden
      fireEvent.press(passwordEyeButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
      
      // Show confirm password too
      fireEvent.press(confirmEyeButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(false);
      
      // Hide password, keep confirm password visible
      fireEvent.press(passwordEyeButton);
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(false);
    });
  });

  describe('User Interactions', () => {
    it('should call console.log with correct data when sign up button is pressed', async () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g. JohnSmith11');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Re-type your password');
      const signUpButton = screen.getByText('Sign Up');
      
      // Fill in form
      fireEvent.changeText(usernameInput, 'TestUser');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      
      // Press sign up button
      fireEvent.press(signUpButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sign up with:', {
          userName: 'TestUser',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        });
      });
    });

    it('should call onAlreadyHaveAccount when link is pressed', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const alreadyHaveAccountLink = screen.getByText('Log In');
      fireEvent.press(alreadyHaveAccountLink);
      
      expect(mockOnAlreadyHaveAccount).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form State Management', () => {
    it('should maintain independent state for all input fields', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g. JohnSmith11');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Re-type your password');
      
      // Change each field independently
      fireEvent.changeText(usernameInput, 'User1');
      expect(usernameInput.props.value).toBe('User1');
      expect(emailInput.props.value).toBe('');
      expect(passwordInput.props.value).toBe('');
      expect(confirmPasswordInput.props.value).toBe('');
      
      fireEvent.changeText(emailInput, 'user@test.com');
      expect(usernameInput.props.value).toBe('User1');
      expect(emailInput.props.value).toBe('user@test.com');
      expect(passwordInput.props.value).toBe('');
      expect(confirmPasswordInput.props.value).toBe('');
      
      fireEvent.changeText(passwordInput, 'pass1');
      fireEvent.changeText(confirmPasswordInput, 'pass2');
      expect(usernameInput.props.value).toBe('User1');
      expect(emailInput.props.value).toBe('user@test.com');
      expect(passwordInput.props.value).toBe('pass1');
      expect(confirmPasswordInput.props.value).toBe('pass2');
    });

    it('should handle empty form submission', async () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const signUpButton = screen.getByText('Sign Up');
      fireEvent.press(signUpButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sign up with:', {
          userName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      });
    });

    it('should handle partial form submission', async () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g. JohnSmith11');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const signUpButton = screen.getByText('Sign Up');
      
      // Only fill username and email
      fireEvent.changeText(usernameInput, 'PartialUser');
      fireEvent.changeText(emailInput, 'partial@test.com');
      fireEvent.press(signUpButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sign up with:', {
          userName: 'PartialUser',
          email: 'partial@test.com',
          password: '',
          confirmPassword: ''
        });
      });
    });
  });

  describe('Password Confirmation Logic', () => {
    it('should allow different values in password and confirm password fields', async () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Re-type your password');
      const signUpButton = screen.getByText('Sign Up');
      
      fireEvent.changeText(passwordInput, 'password1');
      fireEvent.changeText(confirmPasswordInput, 'password2');
      fireEvent.press(signUpButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sign up with:', {
          userName: '',
          email: '',
          password: 'password1',
          confirmPassword: 'password2'
        });
      });
    });

    it('should handle matching passwords correctly', async () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Re-type your password');
      const signUpButton = screen.getByText('Sign Up');
      
      const matchingPassword = 'MatchingPass123!';
      fireEvent.changeText(passwordInput, matchingPassword);
      fireEvent.changeText(confirmPasswordInput, matchingPassword);
      fireEvent.press(signUpButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sign up with:', {
          userName: '',
          email: '',
          password: matchingPassword,
          confirmPassword: matchingPassword
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in all fields', async () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g. JohnSmith11');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Re-type your password');
      const signUpButton = screen.getByText('Sign Up');
      
      fireEvent.changeText(usernameInput, 'User_123!');
      fireEvent.changeText(emailInput, 'test+special@domain-example.co.uk');
      fireEvent.changeText(passwordInput, 'P@ssw0rd!#$%');
      fireEvent.changeText(confirmPasswordInput, 'P@ssw0rd!#$%');
      fireEvent.press(signUpButton);
      
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Sign up with:', {
          userName: 'User_123!',
          email: 'test+special@domain-example.co.uk',
          password: 'P@ssw0rd!#$%',
          confirmPassword: 'P@ssw0rd!#$%'
        });
      });
    });

    it('should handle very long input values', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g. JohnSmith11');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      
      const longUsername = 'u'.repeat(50);
      const longEmail = 'a'.repeat(100) + '@example.com';
      
      fireEvent.changeText(usernameInput, longUsername);
      fireEvent.changeText(emailInput, longEmail);
      
      expect(usernameInput.props.value).toBe(longUsername);
      expect(emailInput.props.value).toBe(longEmail);
    });

    it('should handle rapid state changes', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g. JohnSmith11');
      const passwordEyeButton = screen.getByTestId('password-visibility-toggle');
      const confirmEyeButton = screen.getByTestId('confirm-password-visibility-toggle');
      
      // Rapid username changes
      fireEvent.changeText(usernameInput, 'u');
      fireEvent.changeText(usernameInput, 'us');
      fireEvent.changeText(usernameInput, 'user123');
      
      expect(usernameInput.props.value).toBe('user123');
      
      // Rapid password visibility toggles
      fireEvent.press(passwordEyeButton); // Show
      fireEvent.press(confirmEyeButton); // Show confirm
      fireEvent.press(passwordEyeButton); // Hide
      fireEvent.press(confirmEyeButton); // Hide confirm
      
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Re-type your password');
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for all form fields', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g. JohnSmith11');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Re-type your password');
      
      // Check that accessibility labels or placeholders exist
      expect(usernameInput.props.accessibilityLabel || usernameInput.props.placeholder).toBeTruthy();
      expect(emailInput.props.accessibilityLabel || emailInput.props.placeholder).toBeTruthy();
      expect(passwordInput.props.accessibilityLabel || passwordInput.props.placeholder).toBeTruthy();
      expect(confirmPasswordInput.props.accessibilityLabel || confirmPasswordInput.props.placeholder).toBeTruthy();
    });

    it('should have accessible buttons for password visibility toggles', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const passwordEyeButton = screen.getByTestId('password-visibility-toggle');
      const confirmEyeButton = screen.getByTestId('confirm-password-visibility-toggle');
      
      expect(passwordEyeButton).toBeTruthy();
      expect(confirmEyeButton).toBeTruthy();
    });

    it('should have accessible sign up button', () => {
      render(<SignUpForm onAlreadyHaveAccount={mockOnAlreadyHaveAccount} />);
      
      const signUpButton = screen.getByText('Sign Up');
      expect(signUpButton.props.accessible !== false).toBeTruthy();
    });
  });
});
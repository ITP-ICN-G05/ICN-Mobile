import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PaymentSuccessModal from '../PaymentSuccessModal';

// Mock the Animated library to make animations synchronous for tests
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
  
    // Mock animation functions to run synchronously
    const mockAnimation = (value: { setValue: (arg0: any) => void; }, config: { toValue: any; }) => ({
      start: (callback?: (result: { finished: boolean }) => void) => {
        value.setValue(config.toValue);
        callback?.({ finished: true });
      },
      stop: jest.fn(),
      reset: jest.fn(),
    });
  
    RN.Animated.timing = mockAnimation;
    RN.Animated.spring = mockAnimation;
    RN.Animated.sequence = (animations: Array<{ start: (cb: any) => void }>) => ({
        start: (callback?: (result: { finished: boolean }) => void) => {
            animations.forEach(anim => anim.start(() => {}));
            callback?.({ finished: true });
        },
        stop: jest.fn(),
        reset: jest.fn(),
    });
  
    return RN;
});

const mockOnClose = jest.fn();

const defaultProps = {
  visible: true,
  onClose: mockOnClose,
  planName: 'Premium Plan',
  amount: '$99.99',
  billingCycle: 'yearly' as const,
  nextBillingDate: '2024-09-23',
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
};

describe('PaymentSuccessModal', () => {
  beforeEach(() => {
    // Clear mock history before each test
    mockOnClose.mockClear();
  });

  it('renders correctly with all props', () => {
    const { getByText } = render(<PaymentSuccessModal {...defaultProps} />);

    expect(getByText('Payment Successful!')).toBeTruthy();
    expect(getByText('Welcome to Premium Plan')).toBeTruthy();
    expect(getByText('$99.99')).toBeTruthy();
    expect(getByText('Yearly')).toBeTruthy();
    expect(getByText('🎉 Features Unlocked')).toBeTruthy();
    expect(getByText('Feature 1')).toBeTruthy();
    expect(getByText('Feature 2')).toBeTruthy();
    expect(getByText('Feature 3')).toBeTruthy();
  });

  it('renders correctly for monthly billing cycle', () => {
    const { getByText } = render(<PaymentSuccessModal {...defaultProps} billingCycle="monthly" />);
    expect(getByText('Monthly')).toBeTruthy();
  });

  it('does not render features section if features array is empty', () => {
    const { queryByText } = render(<PaymentSuccessModal {...defaultProps} features={[]} />);
    expect(queryByText('🎉 Features Unlocked')).toBeNull();
  });

  it('calls onClose when "Start Exploring" button is pressed', () => {
    const { getByText } = render(<PaymentSuccessModal {...defaultProps} />);
    fireEvent.press(getByText('Start Exploring'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when "View Receipt" button is pressed', () => {
    const { getByText } = render(<PaymentSuccessModal {...defaultProps} />);
    fireEvent.press(getByText('View Receipt'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(<PaymentSuccessModal {...defaultProps} visible={false} />);
    expect(queryByText('Payment Successful!')).toBeNull();
  });
});
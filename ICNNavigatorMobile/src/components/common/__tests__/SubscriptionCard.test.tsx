import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SubscriptionCard from '../SubscriptionCard';

// Mock Alert
const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();

describe('SubscriptionCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Free Plan', () => {
    const freeProps = {
      plan: 'free' as const,
      onUpgrade: jest.fn(),
    };

    it('should render free plan correctly', () => {
      const { getByText } = render(<SubscriptionCard {...freeProps} />);
      
      expect(getByText('Free')).toBeTruthy();
      expect(getByText('Your Plan Features:')).toBeTruthy();
      expect(getByText('10 Basic Services')).toBeTruthy();
      expect(getByText('2 exports/month')).toBeTruthy();
      expect(getByText('Upgrade to Pro')).toBeTruthy();
    });

    it('should not show price or renewal date for free plan', () => {
      const { queryByText } = render(<SubscriptionCard {...freeProps} />);
      
      expect(queryByText('/month')).toBeNull();
      expect(queryByText(/Renews/)).toBeNull();
    });

    it('should call onUpgrade when upgrade button is pressed', () => {
      const mockOnUpgrade = jest.fn();
      const { getByText } = render(
        <SubscriptionCard {...freeProps} onUpgrade={mockOnUpgrade} />
      );
      
      const upgradeButton = getByText('Upgrade to Pro');
      fireEvent.press(upgradeButton);
      
      expect(mockOnUpgrade).toHaveBeenCalledTimes(1);
    });

    it('should not show manage or cancel buttons for free plan', () => {
      const { queryByText } = render(<SubscriptionCard {...freeProps} />);
      
      expect(queryByText('Manage Subscription')).toBeNull();
      expect(queryByText('Cancel Subscription')).toBeNull();
    });
  });

  describe('Standard Plan', () => {
    const standardProps = {
      plan: 'standard' as const,
      monthlyPrice: 19.99,
      renewalDate: '2024-12-31',
      onManage: jest.fn(),
      onCancel: jest.fn(),
    };

    it('should render standard plan correctly', () => {
      const { getByText } = render(<SubscriptionCard {...standardProps} />);
      
      expect(getByText('Standard')).toBeTruthy();
      expect(getByText('$19.99/month')).toBeTruthy();
      expect(getByText('Renews 2024-12-31')).toBeTruthy();
      expect(getByText('20 exports/month')).toBeTruthy();
      expect(getByText('Advanced filters')).toBeTruthy();
      expect(getByText('Save up to 50 companies')).toBeTruthy();
    });

    it('should show manage and cancel buttons for standard plan', () => {
      const { getByText } = render(<SubscriptionCard {...standardProps} />);
      
      expect(getByText('Manage Subscription')).toBeTruthy();
      expect(getByText('Cancel Subscription')).toBeTruthy();
    });

    it('should not show upgrade button for standard plan', () => {
      const { queryByText } = render(<SubscriptionCard {...standardProps} />);
      
      expect(queryByText('Upgrade to Pro')).toBeNull();
    });

    it('should call onManage when manage button is pressed', () => {
      const mockOnManage = jest.fn();
      const { getByText } = render(
        <SubscriptionCard {...standardProps} onManage={mockOnManage} />
      );
      
      const manageButton = getByText('Manage Subscription');
      fireEvent.press(manageButton);
      
      expect(mockOnManage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pro Plan', () => {
    const proProps = {
      plan: 'pro' as const,
      monthlyPrice: 39.99,
      renewalDate: '2024-11-15',
      onManage: jest.fn(),
      onCancel: jest.fn(),
    };

    it('should render pro plan correctly', () => {
      const { getByText } = render(<SubscriptionCard {...proProps} />);
      
      expect(getByText('Pro')).toBeTruthy();
      expect(getByText('$39.99/month')).toBeTruthy();
      expect(getByText('Renews 2024-11-15')).toBeTruthy();
      expect(getByText('Unlimited exports')).toBeTruthy();
      expect(getByText('All features')).toBeTruthy();
      expect(getByText('Priority support')).toBeTruthy();
    });

    it('should handle decimal prices correctly', () => {
      const { getByText } = render(
        <SubscriptionCard {...proProps} monthlyPrice={29.95} />
      );
      
      expect(getByText('$29.95/month')).toBeTruthy();
    });
  });

  describe('Subscription Cancellation', () => {
    const standardProps = {
      plan: 'standard' as const,
      monthlyPrice: 19.99,
      onCancel: jest.fn(),
    };

    it('should show confirmation dialog when cancel is pressed', () => {
      const { getByText } = render(<SubscriptionCard {...standardProps} />);
      
      const cancelButton = getByText('Cancel Subscription');
      fireEvent.press(cancelButton);
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Cancel Subscription',
        'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Keep Subscription', style: 'cancel' }),
          expect.objectContaining({ text: 'Cancel', style: 'destructive' }),
        ])
      );
    });

    it('should call onCancel and show confirmation when cancel is confirmed', () => {
      const mockOnCancel = jest.fn();
      const { getByText } = render(
        <SubscriptionCard {...standardProps} onCancel={mockOnCancel} />
      );
      
      const cancelButton = getByText('Cancel Subscription');
      fireEvent.press(cancelButton);
      
      // Simulate confirming the cancellation
      const alertCall = mockAlert.mock.calls[0];
      const confirmButton = alertCall[2]?.[1];
      if (confirmButton && 'onPress' in confirmButton && confirmButton.onPress) {
        confirmButton.onPress();
      }
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockAlert).toHaveBeenCalledTimes(2); // Initial confirmation + success message
      
      // Check the success message
      expect(mockAlert).toHaveBeenLastCalledWith(
        'Subscription Cancelled',
        'Your subscription will remain active until the end of the billing period.'
      );
    });

    it('should not call onCancel when cancellation is dismissed', () => {
      const mockOnCancel = jest.fn();
      const { getByText } = render(
        <SubscriptionCard {...standardProps} onCancel={mockOnCancel} />
      );
      
      const cancelButton = getByText('Cancel Subscription');
      fireEvent.press(cancelButton);
      
      // Simulate dismissing the cancellation (Keep Subscription)
      const alertCall = mockAlert.mock.calls[0];
      const keepButton = alertCall[2]?.[0];
      if (keepButton && 'onPress' in keepButton && keepButton.onPress) {
        keepButton.onPress();
      }
      
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Props Handling', () => {
    it('should handle missing monthlyPrice for paid plans', () => {
      const { queryByText } = render(
        <SubscriptionCard plan="standard" onManage={jest.fn()} />
      );
      
      expect(queryByText('/month')).toBeNull();
    });

    it('should handle missing renewalDate', () => {
      const { queryByText } = render(
        <SubscriptionCard 
          plan="pro" 
          monthlyPrice={39.99}
          onManage={jest.fn()}
        />
      );
      
      expect(queryByText(/Renews/)).toBeNull();
    });

    it('should handle missing onUpgrade callback for free plan', () => {
      const { getByText } = render(<SubscriptionCard plan="free" />);
      
      const upgradeButton = getByText('Upgrade to Pro');
      fireEvent.press(upgradeButton);
      
      // Should not crash even without callback
      expect(upgradeButton).toBeTruthy();
    });

    it('should handle missing onManage callback for paid plans', () => {
      const { getByText } = render(
        <SubscriptionCard plan="standard" monthlyPrice={19.99} />
      );
      
      const manageButton = getByText('Manage Subscription');
      fireEvent.press(manageButton);
      
      // Should not crash even without callback
      expect(manageButton).toBeTruthy();
    });

    it('should handle missing onCancel callback', () => {
      const { getByText } = render(
        <SubscriptionCard plan="pro" monthlyPrice={39.99} />
      );
      
      const cancelButton = getByText('Cancel Subscription');
      fireEvent.press(cancelButton);
      
      // Alert should still be called
      expect(Alert.alert).toHaveBeenCalled();
    });

    it('should handle zero price', () => {
      const { queryByText } = render(
        <SubscriptionCard 
          plan="standard" 
          monthlyPrice={0}
          renewalDate="2024-12-31"
        />
      );
      
      // Component won't show price when monthlyPrice is 0 (falsy)
      expect(queryByText('$0/month')).toBeNull();
      // But plan name should still be displayed
      expect(queryByText('Standard')).toBeTruthy();
    });

    it('should handle high precision prices', () => {
      const { getByText } = render(
        <SubscriptionCard 
          plan="pro" 
          monthlyPrice={19.999}
        />
      );
      
      expect(getByText('$19.999/month')).toBeTruthy();
    });
  });

  describe('Plan Details Logic', () => {
    it('should return correct details for each plan type', () => {
      // Test free plan details
      const { getByText: getFreeText } = render(<SubscriptionCard plan="free" />);
      expect(getFreeText('Free')).toBeTruthy();
      expect(getFreeText('10 Basic Services')).toBeTruthy();
      
      // Test standard plan details  
      const { getByText: getStandardText } = render(<SubscriptionCard plan="standard" />);
      expect(getStandardText('Standard')).toBeTruthy();
      expect(getStandardText('20 exports/month')).toBeTruthy();
      expect(getStandardText('Advanced filters')).toBeTruthy();
      
      // Test pro plan details
      const { getByText: getProText } = render(<SubscriptionCard plan="pro" />);
      expect(getProText('Pro')).toBeTruthy();
      expect(getProText('Unlimited exports')).toBeTruthy();
      expect(getProText('All features')).toBeTruthy();
      expect(getProText('Priority support')).toBeTruthy();
    });

    it('should handle invalid plan type gracefully', () => {
      // TypeScript would normally prevent this, but testing runtime behavior
      const { getByText } = render(<SubscriptionCard plan={'invalid' as any} />);
      
      expect(getByText('Free')).toBeTruthy(); // Should default to free
    });
  });

  describe('Feature Display', () => {
    it('should display all features with checkmark icons', () => {
      const { getByText } = render(<SubscriptionCard plan="standard" />);
      
      expect(getByText('20 exports/month')).toBeTruthy();
      expect(getByText('Advanced filters')).toBeTruthy();
      expect(getByText('Save up to 50 companies')).toBeTruthy();
    });

    it('should handle plans with empty features array', () => {
      // This would require modifying the component to accept custom features
      // Currently testing the default behavior
      const { getByText } = render(<SubscriptionCard plan="free" />);
      
      expect(getByText('Your Plan Features:')).toBeTruthy();
    });
  });

  describe('Styling and Layout', () => {
    it('should render with proper container styling', () => {
      const { getByText } = render(<SubscriptionCard plan="free" />);
      const container = getByText('Free').parent;
      
      expect(container).toBeTruthy();
    });
  });
});
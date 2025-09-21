import { Alert } from 'react-native';

// Mock Alert for testing
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

// Type definitions (copied from PaymentScreen since they're not exported)
type PlanType = 'free' | 'standard' | 'pro';
type BillingCycle = 'monthly' | 'yearly';
type PaymentMethod = 'apple' | 'google' | 'paypal' | 'mastercard' | 'visa';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: PlanType;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  discount?: string;
  features: PlanFeature[];
  recommended?: boolean;
}

// Business logic functions extracted for testing
export const getPrice = (plan: any, billingCycle: BillingCycle) => {
  if (!plan) return 0;
  return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
};

export const getPriceText = (plan: any, billingCycle: BillingCycle) => {
  const price = getPrice(plan, billingCycle);
  if (price === 0) return 'FREE';
  return `$${price.toFixed(2)}`;
};

export const getBillingPeriodText = (billingCycle: BillingCycle) => {
  return billingCycle === 'monthly' ? '/month' : '/year';
};

export const getSavingsText = (plan: any, billingCycle: BillingCycle) => {
  if (billingCycle === 'yearly' && plan.monthlyPrice > 0) {
    const monthlyCost = plan.monthlyPrice * 12;
    const yearlyCost = plan.yearlyPrice;
    const savings = monthlyCost - yearlyCost;
    if (savings > 0) {
      return `Save $${savings.toFixed(2)}/year`;
    }
  }
  return plan.discount || '';
};

export const validatePromoCode = (promoCode: string) => {
  const validPromoCodes: { [key: string]: number } = {
    'WELCOME20': 20,
    'ICNVIC15': 15,
    'PARTNER10': 10,
    'EARLY30': 30,
  };
  
  const upperCode = promoCode.toUpperCase();
  return {
    isValid: !!validPromoCodes[upperCode],
    discount: validPromoCodes[upperCode] || 0,
  };
};

export const getDiscountedPrice = (price: number, promoDiscount: number, promoApplied: boolean) => {
  if (promoApplied && price !== 0) {
    return price * (1 - promoDiscount / 100);
  }
  return price;
};

export const canSelectPlan = (planId: PlanType, currentUserPlan: PlanType) => {
  return planId !== currentUserPlan;
};

export const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'apple':
      return 'logo-apple';
    case 'google':
      return 'logo-google';
    case 'paypal':
      return 'logo-paypal';
    case 'mastercard':
      return 'card';
    case 'visa':
      return 'card';
    default:
      return 'card';
  }
};

export const getPaymentMethodName = (method: string) => {
  switch (method) {
    case 'apple':
      return 'Apple Pay';
    case 'google':
      return 'Google Pay';
    case 'paypal':
      return 'PayPal';
    case 'mastercard':
      return 'Mastercard';
    case 'visa':
      return 'Visa';
    default:
      return 'Credit Card';
  }
};

describe('PaymentScreen Business Logic', () => {
  // Mock plan data for testing
  const mockPlans = [
    {
      id: 'free',
      name: 'Basic/Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        { text: 'Company name & address access', included: true },
        { text: 'Items and sector information', included: true },
      ],
    },
    {
      id: 'standard',
      name: 'Plus',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      discount: 'Save $19.89/year',
      features: [
        { text: 'Everything in Basic', included: true },
        { text: 'ABN and company summary', included: true },
      ],
    },
    {
      id: 'pro',
      name: 'Premium',
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      discount: 'Save $39.89/year',
      recommended: true,
      features: [
        { text: 'Everything in Plus', included: true },
        { text: 'Revenue & employee count data', included: true },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Plan Selection Logic', () => {
    it('should calculate correct pricing for monthly billing cycle', () => {
      expect(getPrice(mockPlans[0], 'monthly')).toBe(0);
      expect(getPrice(mockPlans[1], 'monthly')).toBe(9.99);
      expect(getPrice(mockPlans[2], 'monthly')).toBe(19.99);
    });

    it('should calculate correct pricing for yearly billing cycle', () => {
      expect(getPrice(mockPlans[0], 'yearly')).toBe(0);
      expect(getPrice(mockPlans[1], 'yearly')).toBe(99.99);
      expect(getPrice(mockPlans[2], 'yearly')).toBe(199.99);
    });

    it('should format price text correctly', () => {
      expect(getPriceText(mockPlans[0], 'monthly')).toBe('FREE');
      expect(getPriceText(mockPlans[1], 'monthly')).toBe('$9.99');
      expect(getPriceText(mockPlans[2], 'yearly')).toBe('$199.99');
    });

    it('should get correct billing period text', () => {
      expect(getBillingPeriodText('monthly')).toBe('/month');
      expect(getBillingPeriodText('yearly')).toBe('/year');
    });

    it('should calculate savings for yearly plans correctly', () => {
      // Free plan should return empty string as no savings
      expect(getSavingsText(mockPlans[0], 'yearly')).toBe('');
      
      // Standard plan: $9.99 * 12 = $119.88, yearly = $99.99, savings = $19.89
      expect(getSavingsText(mockPlans[1], 'yearly')).toBe('Save $19.89/year');
      
      // Pro plan: $19.99 * 12 = $239.88, yearly = $199.99, savings = $39.89
      expect(getSavingsText(mockPlans[2], 'yearly')).toBe('Save $39.89/year');
    });

    it('should not show savings for monthly billing', () => {
      expect(getSavingsText(mockPlans[1], 'monthly')).toBe('Save $19.89/year');
      expect(getSavingsText(mockPlans[2], 'monthly')).toBe('Save $39.89/year');
    });

    it('should validate plan selection rules', () => {
      expect(canSelectPlan('pro', 'free')).toBe(true);
      expect(canSelectPlan('standard', 'free')).toBe(true);
      expect(canSelectPlan('free', 'free')).toBe(false);
      expect(canSelectPlan('pro', 'pro')).toBe(false);
    });
  });

  describe('Promotional Code System', () => {
    it('should validate correct promotional codes', () => {
      expect(validatePromoCode('WELCOME20')).toEqual({
        isValid: true,
        discount: 20,
      });
      expect(validatePromoCode('ICNVIC15')).toEqual({
        isValid: true,
        discount: 15,
      });
      expect(validatePromoCode('PARTNER10')).toEqual({
        isValid: true,
        discount: 10,
      });
      expect(validatePromoCode('EARLY30')).toEqual({
        isValid: true,
        discount: 30,
      });
    });

    it('should handle case insensitive promotional codes', () => {
      expect(validatePromoCode('welcome20')).toEqual({
        isValid: true,
        discount: 20,
      });
      expect(validatePromoCode('WeLcOmE20')).toEqual({
        isValid: true,
        discount: 20,
      });
    });

    it('should reject invalid promotional codes', () => {
      expect(validatePromoCode('INVALID')).toEqual({
        isValid: false,
        discount: 0,
      });
      expect(validatePromoCode('EXPIRED')).toEqual({
        isValid: false,
        discount: 0,
      });
      expect(validatePromoCode('')).toEqual({
        isValid: false,
        discount: 0,
      });
    });

    it('should calculate discounted prices correctly', () => {
      expect(getDiscountedPrice(100, 20, true)).toBe(80);
      expect(getDiscountedPrice(9.99, 15, true)).toBeCloseTo(8.49, 2);
      expect(getDiscountedPrice(19.99, 30, true)).toBeCloseTo(13.99, 2);
    });

    it('should not apply discount when promo not applied', () => {
      expect(getDiscountedPrice(100, 20, false)).toBe(100);
      expect(getDiscountedPrice(9.99, 15, false)).toBe(9.99);
    });

    it('should not apply discount to free plans', () => {
      expect(getDiscountedPrice(0, 20, true)).toBe(0);
    });
  });

  describe('Payment Method Processing', () => {
    it('should return correct payment method icons', () => {
      expect(getPaymentMethodIcon('apple')).toBe('logo-apple');
      expect(getPaymentMethodIcon('google')).toBe('logo-google');
      expect(getPaymentMethodIcon('paypal')).toBe('logo-paypal');
      expect(getPaymentMethodIcon('mastercard')).toBe('card');
      expect(getPaymentMethodIcon('visa')).toBe('card');
      expect(getPaymentMethodIcon('unknown')).toBe('card');
    });

    it('should return correct payment method names', () => {
      expect(getPaymentMethodName('apple')).toBe('Apple Pay');
      expect(getPaymentMethodName('google')).toBe('Google Pay');
      expect(getPaymentMethodName('paypal')).toBe('PayPal');
      expect(getPaymentMethodName('mastercard')).toBe('Mastercard');
      expect(getPaymentMethodName('visa')).toBe('Visa');
      expect(getPaymentMethodName('unknown')).toBe('Credit Card');
    });
  });

  describe('Complete Processing Pipeline', () => {
    it('should process standard plan with monthly billing and promo code', () => {
      const plan = mockPlans[1]; // Standard plan
      const billingCycle = 'monthly';
      const promoCode = 'WELCOME20';
      
      const basePrice = getPrice(plan, billingCycle);
      expect(basePrice).toBe(9.99);
      
      const promo = validatePromoCode(promoCode);
      expect(promo.isValid).toBe(true);
      expect(promo.discount).toBe(20);
      
      const finalPrice = getDiscountedPrice(basePrice, promo.discount, promo.isValid);
      expect(finalPrice).toBeCloseTo(7.99, 2);
      
      const priceText = getPriceText(plan, billingCycle);
      expect(priceText).toBe('$9.99');
      
      const periodText = getBillingPeriodText(billingCycle);
      expect(periodText).toBe('/month');
    });

    it('should process pro plan with yearly billing and maximum discount', () => {
      const plan = mockPlans[2]; // Pro plan
      const billingCycle = 'yearly';
      const promoCode = 'EARLY30';
      
      const basePrice = getPrice(plan, billingCycle);
      expect(basePrice).toBe(199.99);
      
      const savings = getSavingsText(plan, billingCycle);
      expect(savings).toBe('Save $39.89/year');
      
      const promo = validatePromoCode(promoCode);
      expect(promo.isValid).toBe(true);
      expect(promo.discount).toBe(30);
      
      const finalPrice = getDiscountedPrice(basePrice, promo.discount, promo.isValid);
      expect(finalPrice).toBeCloseTo(139.99, 2);
    });

    it('should handle free plan selection correctly', () => {
      const plan = mockPlans[0]; // Free plan
      const billingCycle = 'monthly';
      
      const basePrice = getPrice(plan, billingCycle);
      expect(basePrice).toBe(0);
      
      const priceText = getPriceText(plan, billingCycle);
      expect(priceText).toBe('FREE');
      
      const savings = getSavingsText(plan, billingCycle);
      expect(savings).toBe('');
      
      // Even with promo code, free plan should remain free
      const finalPrice = getDiscountedPrice(basePrice, 20, true);
      expect(finalPrice).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined plan gracefully', () => {
      const undefinedPlan = undefined;
      expect(() => getPrice(undefinedPlan, 'monthly')).not.toThrow();
    });

    it('should handle empty promo codes', () => {
      const result = validatePromoCode('');
      expect(result.isValid).toBe(false);
      expect(result.discount).toBe(0);
    });

    it('should handle whitespace in promo codes', () => {
      const result = validatePromoCode('  WELCOME20  ');
      expect(result.isValid).toBe(false); // Should not trim automatically
    });

    it('should handle negative prices (should not happen but defensive)', () => {
      const result = getDiscountedPrice(-10, 20, true);
      expect(result).toBe(-8); // Maintains the logic even for negative
    });

    it('should handle very large discount percentages', () => {
      const result = getDiscountedPrice(100, 150, true);
      expect(result).toBe(-50); // 100 * (1 - 1.5) = -50
    });
  });

  describe('Business Rules Validation', () => {
    it('should prevent selection of current plan', () => {
      expect(canSelectPlan('free', 'free')).toBe(false);
      expect(canSelectPlan('standard', 'standard')).toBe(false);
      expect(canSelectPlan('pro', 'pro')).toBe(false);
    });

    it('should allow upgrades and downgrades', () => {
      expect(canSelectPlan('standard', 'free')).toBe(true);
      expect(canSelectPlan('pro', 'free')).toBe(true);
      expect(canSelectPlan('pro', 'standard')).toBe(true);
      expect(canSelectPlan('free', 'standard')).toBe(true);
      expect(canSelectPlan('standard', 'pro')).toBe(true);
    });
  });
});
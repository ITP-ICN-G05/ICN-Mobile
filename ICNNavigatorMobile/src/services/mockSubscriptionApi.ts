import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Subscription {
    id: string;
    userId: string;
    tier: 'free' | 'plus' | 'premium';
    status: 'active' | 'cancelled' | 'expired' | 'trial';
    startDate: string;
    endDate?: string;
    nextBillingDate?: string;
    amount?: number;
    currency?: string;
    billingPeriod?: 'monthly' | 'yearly';
    paymentMethod?: PaymentMethod;
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
    trialEndsAt?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'bank';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface CreateSubscriptionData {
  tier: 'plus' | 'premium';
  planId: string;
  billingPeriod: 'monthly' | 'yearly';
  paymentMethodId: string;
  promoCode?: string;
}

export interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceUrl?: string;
}

// Mock data storage
const STORAGE_KEYS = {
  SUBSCRIPTION: '@mock_subscription',
  PAYMENT_METHODS: '@mock_payment_methods',
  BILLING_HISTORY: '@mock_billing_history',
};

// Helper to generate dates
const getFutureDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const getPastDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

class MockSubscriptionApiService {
  private mockDelay = () => new Promise(resolve => setTimeout(resolve, 500));

  private async getStoredData<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private async storeData<T>(key: string, data: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }

  // Initialize default subscription (free tier)
  private getDefaultSubscription(): Subscription {
    return {
      id: 'sub_mock_free',
      userId: 'user_mock_123',
      tier: 'free',
      status: 'active',
      startDate: getPastDate(30),
      autoRenew: false,
      cancelAtPeriodEnd: false,
    };
  }

  // Subscription Management
  async getSubscription(): Promise<Subscription> {
    await this.mockDelay();
    const subscription = await this.getStoredData(
      STORAGE_KEYS.SUBSCRIPTION,
      this.getDefaultSubscription()
    );
    return subscription;
  }

  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    await this.mockDelay();
    
    const monthlyPrices = { plus: 9.99, premium: 19.99 };
    const yearlyPrices = { plus: 99.99, premium: 199.99 };
    
    const newSubscription: Subscription = {
      id: `sub_mock_${Date.now()}`,
      userId: 'user_mock_123',
      tier: data.tier,
      status: 'active',
      startDate: new Date().toISOString(),
      nextBillingDate: data.billingPeriod === 'monthly' ? getFutureDate(30) : getFutureDate(365),
      amount: data.billingPeriod === 'monthly' 
        ? monthlyPrices[data.tier]
        : yearlyPrices[data.tier],
      currency: 'AUD',
      billingPeriod: data.billingPeriod,
      autoRenew: true,
      cancelAtPeriodEnd: false,
      paymentMethod: {
        id: data.paymentMethodId,
        type: 'card',
        last4: '4242',
        brand: 'Visa',
        isDefault: true,
      },
    };
    
    await this.storeData(STORAGE_KEYS.SUBSCRIPTION, newSubscription);
    
    // Add to billing history
    await this.addBillingHistoryEntry({
      id: `invoice_${Date.now()}`,
      date: new Date().toISOString(),
      amount: newSubscription.amount!,
      status: 'paid',
      description: `${data.tier.charAt(0).toUpperCase() + data.tier.slice(1)} ${data.billingPeriod.charAt(0).toUpperCase() + data.billingPeriod.slice(1)} Subscription`,
    });
    
    return newSubscription;
  }

  async updateSubscription(planId: string): Promise<Subscription> {
    await this.mockDelay();
    
    const current = await this.getSubscription();
    const tier = planId.includes('premium') ? 'premium' : 'plus';
    const isMonthly = planId.includes('monthly');
    
    const monthlyPrices = { plus: 9.99, premium: 19.99 };
    const yearlyPrices = { plus: 99.99, premium: 199.99 };
    
    const updated: Subscription = {
      ...current,
      tier,
      status: 'active',
      amount: isMonthly ? monthlyPrices[tier] : yearlyPrices[tier],
      nextBillingDate: isMonthly ? getFutureDate(30) : getFutureDate(365),
      autoRenew: true,
      cancelAtPeriodEnd: false,
    };
    
    await this.storeData(STORAGE_KEYS.SUBSCRIPTION, updated);
    return updated;
  }

  async cancelSubscription(): Promise<void> {
    await this.mockDelay();
    
    // Direct downgrade to free tier
    const freeSubscription: Subscription = {
      id: 'sub_mock_free',
      userId: 'user_mock_123',
      tier: 'free',
      status: 'active',
      startDate: new Date().toISOString(),
      autoRenew: false,
      cancelAtPeriodEnd: false,
    };
    
    await this.storeData(STORAGE_KEYS.SUBSCRIPTION, freeSubscription);
  }

  async reactivateSubscription(): Promise<Subscription> {
    await this.mockDelay();
    
    const subscription = await this.getSubscription();
    const reactivated = {
      ...subscription,
      status: 'active' as const,
      cancelAtPeriodEnd: false,
      autoRenew: true,
    };
    
    await this.storeData(STORAGE_KEYS.SUBSCRIPTION, reactivated);
    return reactivated;
  }

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    await this.mockDelay();
    
    const methods = await this.getStoredData(STORAGE_KEYS.PAYMENT_METHODS, [
      {
        id: 'pm_mock_visa',
        type: 'card' as const,
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2027,
        isDefault: true,
      },
    ]);
    
    return methods;
  }

  async addPaymentMethod(token: string): Promise<PaymentMethod> {
    await this.mockDelay();
    
    const newMethod: PaymentMethod = {
      id: `pm_mock_${Date.now()}`,
      type: 'card',
      last4: Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
      brand: ['Visa', 'Mastercard', 'Amex'][Math.floor(Math.random() * 3)],
      expiryMonth: Math.floor(Math.random() * 12) + 1,
      expiryYear: 2027 + Math.floor(Math.random() * 5),
      isDefault: false,
    };
    
    const methods = await this.getPaymentMethods();
    methods.push(newMethod);
    await this.storeData(STORAGE_KEYS.PAYMENT_METHODS, methods);
    
    return newMethod;
  }

  async updatePaymentMethod(id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
    await this.mockDelay();
    
    const methods = await this.getPaymentMethods();
    const index = methods.findIndex(m => m.id === id);
    
    if (index === -1) {
      throw new Error('Payment method not found');
    }
    
    methods[index] = { ...methods[index], ...data };
    await this.storeData(STORAGE_KEYS.PAYMENT_METHODS, methods);
    
    return methods[index];
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await this.mockDelay();
    
    const methods = await this.getPaymentMethods();
    const filtered = methods.filter(m => m.id !== id);
    
    if (filtered.length === methods.length) {
      throw new Error('Payment method not found');
    }
    
    await this.storeData(STORAGE_KEYS.PAYMENT_METHODS, filtered);
  }

  async setDefaultPaymentMethod(id: string): Promise<void> {
    await this.mockDelay();
    
    const methods = await this.getPaymentMethods();
    const updated = methods.map(m => ({
      ...m,
      isDefault: m.id === id,
    }));
    
    await this.storeData(STORAGE_KEYS.PAYMENT_METHODS, updated);
  }

  // Billing History
  async getBillingHistory(limit = 10): Promise<BillingHistory[]> {
    await this.mockDelay();
    
    const defaultHistory: BillingHistory[] = [
      {
        id: 'invoice_001',
        date: getPastDate(30),
        amount: 9.99,
        status: 'paid',
        description: 'Plus Monthly Subscription',
      },
      {
        id: 'invoice_002',
        date: getPastDate(60),
        amount: 9.99,
        status: 'paid',
        description: 'Plus Monthly Subscription',
      },
    ];
    
    const history = await this.getStoredData(STORAGE_KEYS.BILLING_HISTORY, defaultHistory);
    return history.slice(0, limit);
  }

  private async addBillingHistoryEntry(entry: BillingHistory): Promise<void> {
    const history = await this.getBillingHistory(100);
    history.unshift(entry);
    await this.storeData(STORAGE_KEYS.BILLING_HISTORY, history);
  }

  async getInvoice(invoiceId: string): Promise<string> {
    await this.mockDelay();
    return `https://mock-invoices.example.com/${invoiceId}`;
  }

  async downloadAllInvoices(): Promise<Blob> {
    await this.mockDelay();
    return new Blob(['Mock invoice data'], { type: 'application/pdf' });
  }

  // Promo Codes
  async validatePromoCode(code: string): Promise<{ valid: boolean; discount: number }> {
    await this.mockDelay();
    
    const validCodes: { [key: string]: number } = {
      'WELCOME20': 20,
      'ICNVIC15': 15,
      'PARTNER10': 10,
      'EARLY30': 30,
    };
    
    const discount = validCodes[code.toUpperCase()];
    return {
      valid: !!discount,
      discount: discount || 0,
    };
  }

  async applyPromoCode(code: string): Promise<void> {
    await this.mockDelay();
    const validation = await this.validatePromoCode(code);
    
    if (!validation.valid) {
      throw new Error('Invalid promo code');
    }
  }

  // Trial
  async startTrial(tier: 'plus' | 'premium'): Promise<Subscription> {
    await this.mockDelay();
    
    const trialSubscription: Subscription = {
      id: `sub_trial_${Date.now()}`,
      userId: 'user_mock_123',
      tier,
      status: 'trial',
      startDate: new Date().toISOString(),
      trialEndsAt: getFutureDate(14), // 14-day trial
      autoRenew: true,
      cancelAtPeriodEnd: false,
    };
    
    await this.storeData(STORAGE_KEYS.SUBSCRIPTION, trialSubscription);
    return trialSubscription;
  }

  // Export user data
  async exportUserData(): Promise<any> {
    await this.mockDelay();
    
    return {
      subscription: await this.getSubscription(),
      paymentMethods: await this.getPaymentMethods(),
      billingHistory: await this.getBillingHistory(100),
      exportDate: new Date().toISOString(),
    };
  }
}

export const mockSubscriptionApi = new MockSubscriptionApiService();
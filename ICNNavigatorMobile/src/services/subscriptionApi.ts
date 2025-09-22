import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.icnvictoria.com'; // Replace with your actual API URL

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

class SubscriptionApiService {
  private async getAuthToken(): Promise<string> {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('No auth token found');
    return token;
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ) {
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Subscription Management
  async getSubscription(): Promise<Subscription> {
    return this.makeRequest('/subscription');
  }

  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    return this.makeRequest('/subscription', 'POST', data);
  }

  async updateSubscription(planId: string): Promise<Subscription> {
    return this.makeRequest(`/subscription/plan/${planId}`, 'PUT');
  }

  async cancelSubscription(): Promise<void> {
    return this.makeRequest('/subscription/cancel', 'POST');
  }

  async reactivateSubscription(): Promise<Subscription> {
    return this.makeRequest('/subscription/reactivate', 'POST');
  }

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return this.makeRequest('/payment-methods');
  }

  async addPaymentMethod(token: string): Promise<PaymentMethod> {
    return this.makeRequest('/payment-methods', 'POST', { token });
  }

  async updatePaymentMethod(id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
    return this.makeRequest(`/payment-methods/${id}`, 'PUT', data);
  }

  async deletePaymentMethod(id: string): Promise<void> {
    return this.makeRequest(`/payment-methods/${id}`, 'DELETE');
  }

  async setDefaultPaymentMethod(id: string): Promise<void> {
    return this.makeRequest(`/payment-methods/${id}/default`, 'POST');
  }

  // Billing History
  async getBillingHistory(limit = 10): Promise<BillingHistory[]> {
    return this.makeRequest(`/billing-history?limit=${limit}`);
  }

  async getInvoice(invoiceId: string): Promise<string> {
    return this.makeRequest(`/invoices/${invoiceId}`);
  }

  async downloadAllInvoices(): Promise<Blob> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/invoices/download-all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download invoices');
    }

    return response.blob();
  }

  // Promo Codes
  async validatePromoCode(code: string): Promise<{ valid: boolean; discount: number }> {
    return this.makeRequest('/promo-codes/validate', 'POST', { code });
  }

  async applyPromoCode(code: string): Promise<void> {
    return this.makeRequest('/promo-codes/apply', 'POST', { code });
  }

  // Trial
  async startTrial(tier: 'plus' | 'premium'): Promise<Subscription> {
    return this.makeRequest('/subscription/trial', 'POST', { tier });
  }
}

export const subscriptionApi = new SubscriptionApiService();

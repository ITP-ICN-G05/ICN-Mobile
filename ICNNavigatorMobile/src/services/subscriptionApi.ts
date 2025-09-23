import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useUserTier } from '../contexts/UserTierContext';
// Import the mock API instead of the real one
import { mockSubscriptionApi as subscriptionApi, Subscription } from '../services/mockSubscriptionApi';

export function useSubscription() {
  const { currentTier, setCurrentTier } = useUserTier();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const sub = await subscriptionApi.getSubscription();
      setSubscription(sub);
      setCurrentTier(sub.tier);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription');
      console.error('Failed to load subscription:', err);
      // Set default free tier if loading fails
      setCurrentTier('free');
      setSubscription({
        id: 'sub_default',
        userId: 'user_default',
        tier: 'free',
        status: 'active',
        startDate: new Date().toISOString(),
        autoRenew: false,
        cancelAtPeriodEnd: false,
      });
    } finally {
      setLoading(false);
    }
  }, [setCurrentTier]);

  const createSubscription = useCallback(async (
    tier: 'plus' | 'premium',
    billingPeriod: 'monthly' | 'yearly',
    paymentMethodId?: string,
    promoCode?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const planId = `${tier}_${billingPeriod}`;
      const newSub = await subscriptionApi.createSubscription({
        tier,
        planId,
        billingPeriod,
        paymentMethodId: paymentMethodId || 'pm_default',
        promoCode,
      });
      
      setSubscription(newSub);
      setCurrentTier(newSub.tier);
      
      // Show success message
      Alert.alert(
        'Success!',
        `You've successfully upgraded to ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan!`,
        [{ text: 'OK' }]
      );
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message || 'Failed to create subscription');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [setCurrentTier]);

  const upgradeSubscription = useCallback(async (planId: string) => {
    try {
      setLoading(true);
      setError(null);
      const updatedSub = await subscriptionApi.updateSubscription(planId);
      setSubscription(updatedSub);
      setCurrentTier(updatedSub.tier);
      
      Alert.alert(
        'Plan Updated!',
        `Your subscription has been successfully updated.`,
        [{ text: 'OK' }]
      );
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message || 'Failed to update subscription');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [setCurrentTier]);

  const downgradeToFree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For downgrading to free, we cancel the subscription
      await subscriptionApi.cancelSubscription();
      
      const freeSub: Subscription = {
        id: 'sub_free',
        userId: 'user_mock',
        tier: 'free',
        status: 'active',
        startDate: new Date().toISOString(),
        autoRenew: false,
        cancelAtPeriodEnd: false,
      };
      
      setSubscription(freeSub);
      setCurrentTier('free');
      
      Alert.alert(
        'Downgraded to Free',
        'Your subscription has been cancelled. You now have the free tier.',
        [{ text: 'OK' }]
      );
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message || 'Failed to downgrade');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [setCurrentTier]);

  const cancelSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await subscriptionApi.cancelSubscription();
      
      setSubscription(prev => prev ? {
        ...prev,
        status: 'cancelled',
        cancelAtPeriodEnd: true,
        autoRenew: false,
      } : null);
      
      Alert.alert(
        'Subscription Cancelled',
        'Your subscription will remain active until the end of the billing period.',
        [{ text: 'OK' }]
      );
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message || 'Failed to cancel subscription');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const reactivateSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const updatedSub = await subscriptionApi.reactivateSubscription();
      setSubscription(updatedSub);
      
      Alert.alert(
        'Subscription Reactivated',
        'Your subscription has been reactivated successfully.',
        [{ text: 'OK' }]
      );
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message || 'Failed to reactivate subscription');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const validatePromoCode = useCallback(async (code: string) => {
    try {
      const result = await subscriptionApi.validatePromoCode(code);
      return result;
    } catch (err: any) {
      return { valid: false, discount: 0 };
    }
  }, []);

  const startTrial = useCallback(async (tier: 'plus' | 'premium') => {
    try {
      setLoading(true);
      setError(null);
      const trialSub = await subscriptionApi.startTrial(tier);
      setSubscription(trialSub);
      setCurrentTier(trialSub.tier);
      
      Alert.alert(
        'Trial Started!',
        `Your 14-day free trial of ${tier.charAt(0).toUpperCase() + tier.slice(1)} has started.`,
        [{ text: 'OK' }]
      );
      
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message || 'Failed to start trial');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [setCurrentTier]);

  return {
    subscription,
    loading,
    error,
    currentTier,
    createSubscription,
    upgradeSubscription,
    downgradeToFree,
    cancelSubscription,
    reactivateSubscription,
    refreshSubscription: loadSubscription,
    validatePromoCode,
    startTrial,
  };
}
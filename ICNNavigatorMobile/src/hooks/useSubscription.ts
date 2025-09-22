import { useState, useEffect, useCallback } from 'react';
import { useUserTier } from '../contexts/UserTierContext';
import { subscriptionApi, Subscription } from '../services/subscriptionApi';

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
      setError(err.message);
      console.error('Failed to load subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [setCurrentTier]);

  const upgradeSubscription = useCallback(async (planId: string) => {
    try {
      setLoading(true);
      const updatedSub = await subscriptionApi.updateSubscription(planId);
      setSubscription(updatedSub);
      setCurrentTier(updatedSub.tier);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [setCurrentTier]);

  const cancelSubscription = useCallback(async () => {
    try {
      setLoading(true);
      await subscriptionApi.cancelSubscription();
      setSubscription(prev => prev ? {
        ...prev,
        status: 'cancelled',
        cancelAtPeriodEnd: true,
      } : null);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const reactivateSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const updatedSub = await subscriptionApi.reactivateSubscription();
      setSubscription(updatedSub);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    subscription,
    loading,
    error,
    currentTier,
    upgradeSubscription,
    cancelSubscription,
    reactivateSubscription,
    refreshSubscription: loadSubscription,
  };
}
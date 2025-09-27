import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './UserContext';

export type UserTier = 'free' | 'plus' | 'premium';

interface TierFeatures {
  maxBookmarkFolders: number;
  canCreateFolders: boolean;
  canFilterBySize: boolean;
  canFilterByCertifications: boolean;
  canFilterByDiversity: boolean;
  canFilterByRevenue: boolean;
  canExportFull: boolean;
  exportLimit: number;
  canAccessChat: boolean;
  canSeeABN: boolean;
  canSeeRevenue: boolean;
  canSeeEmployeeCount: boolean;
  canSeeLocalContent: boolean;
}

const TIER_FEATURES: Record<UserTier, TierFeatures> = {
  free: {
    maxBookmarkFolders: 1,
    canCreateFolders: false,
    canFilterBySize: false,
    canFilterByCertifications: false,
    canFilterByDiversity: false,
    canFilterByRevenue: false,
    canExportFull: false,
    exportLimit: 10,
    canAccessChat: false,
    canSeeABN: false,
    canSeeRevenue: false,
    canSeeEmployeeCount: false,
    canSeeLocalContent: false,
  },
  plus: {
    maxBookmarkFolders: 1,
    canCreateFolders: false,
    canFilterBySize: true,
    canFilterByCertifications: true,
    canFilterByDiversity: false,
    canFilterByRevenue: false,
    canExportFull: false,
    exportLimit: 50,
    canAccessChat: true,
    canSeeABN: true,
    canSeeRevenue: false,
    canSeeEmployeeCount: false,
    canSeeLocalContent: false,
  },
  premium: {
    maxBookmarkFolders: 10,
    canCreateFolders: true,
    canFilterBySize: true,
    canFilterByCertifications: true,
    canFilterByDiversity: true,
    canFilterByRevenue: true,
    canExportFull: true,
    exportLimit: -1, // unlimited
    canAccessChat: true,
    canSeeABN: true,
    canSeeRevenue: true,
    canSeeEmployeeCount: true,
    canSeeLocalContent: true,
  },
};

interface SubscriptionInfo {
  tier: UserTier;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  expiresAt?: string;
  autoRenew: boolean;
  planId?: string;
  nextBillingDate?: string;
}

interface UserTierContextType {
  currentTier: UserTier;
  subscription: SubscriptionInfo | null;
  features: TierFeatures;
  isLoading: boolean;
  setCurrentTier: (tier: UserTier) => void;
  checkFeatureAccess: (feature: keyof TierFeatures) => boolean;
  refreshSubscription: () => Promise<void>;
  upgradeTier: (newTier: UserTier) => Promise<void>;
}

const UserTierContext = createContext<UserTierContextType | undefined>(undefined);

export function UserTierProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useUser();
  const [currentTier, setCurrentTier] = useState<UserTier>('free');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const features = TIER_FEATURES[currentTier];

  // Load subscription data
  const loadSubscription = async () => {
    try {
      setIsLoading(true);
      
      // Load from local storage first
      const cachedSubscription = await AsyncStorage.getItem('@user_subscription');
      if (cachedSubscription) {
        const parsed = JSON.parse(cachedSubscription);
        setSubscription(parsed);
        setCurrentTier(parsed.tier);
      }
      
      // Fetch from backend if authenticated
      if (isAuthenticated) {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
          try {
            const response = await fetch('https://api.icnvictoria.com/subscription/current', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              const subscriptionData = await response.json();
              setSubscription(subscriptionData);
              setCurrentTier(subscriptionData.tier);
              await AsyncStorage.setItem('@user_subscription', JSON.stringify(subscriptionData));
            }
          } catch (apiError) {
            console.warn('Failed to fetch subscription from backend');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has access to a specific feature
  const checkFeatureAccess = (feature: keyof TierFeatures): boolean => {
    const value = features[feature];
    return typeof value === 'boolean' ? value : value > 0;
  };

  // Refresh subscription data
  const refreshSubscription = async () => {
    await loadSubscription();
  };

  // Upgrade tier (trigger payment flow)
  const upgradeTier = async (newTier: UserTier) => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('@auth_token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Call backend to initiate upgrade
      const response = await fetch('https://api.icnvictoria.com/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: newTier }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to upgrade subscription');
      }
      
      const result = await response.json();
      
      // Update local state if upgrade successful
      if (result.success) {
        setCurrentTier(newTier);
        const newSubscription: SubscriptionInfo = {
          tier: newTier,
          status: 'active',
          expiresAt: result.expiresAt,
          autoRenew: true,
          planId: result.planId,
          nextBillingDate: result.nextBillingDate,
        };
        setSubscription(newSubscription);
        await AsyncStorage.setItem('@user_subscription', JSON.stringify(newSubscription));
      }
      
      return result;
    } catch (error) {
      console.error('Failed to upgrade tier:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Load subscription on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      loadSubscription();
    } else {
      // Reset to free tier when logged out
      setCurrentTier('free');
      setSubscription(null);
    }
  }, [isAuthenticated]);

  return (
    <UserTierContext.Provider value={{ 
      currentTier, 
      subscription,
      features,
      isLoading,
      setCurrentTier, 
      checkFeatureAccess,
      refreshSubscription,
      upgradeTier
    }}>
      {children}
    </UserTierContext.Provider>
  );
}

export const useUserTier = () => {
  const context = useContext(UserTierContext);
  if (!context) {
    throw new Error('useUserTier must be used within UserTierProvider');
  }
  return context;
};
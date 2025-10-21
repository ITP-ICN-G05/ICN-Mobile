import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useUserTier } from '@/contexts/UserTierContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useUser } from '@/contexts/UserContext';
import { useSettings } from '@/contexts/SettingsContext';
import { UserStats, TierInfo, CollapsedSections } from '../types';

export const useProfileData = () => {
  const navigation = useNavigation<any>();
  const { currentTier } = useUserTier();
  const { subscription, refreshSubscription } = useSubscription();
  const { user, isLoading: userLoading, refreshUser } = useUser();
  const { settings, syncSettings } = useSettings();

  const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>({
    account: true,
    preferences: true,
    dataPrivacy: true,
    support: true,
    about: true,
  });

  // Refresh data when screen focuses
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshSubscription();
      syncSettings();
    });
    return unsubscribe;
  }, [navigation, refreshSubscription, syncSettings]);

  const toggleSection = (section: keyof CollapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStats = (): UserStats => {
    const tier = subscription?.tier || currentTier;
    switch(tier) {
      case 'premium':
        return { saved: '∞', searches: '∞', exports: '∞' };
      case 'plus':
        return { saved: '50', searches: '500/mo', exports: '50/mo' };
      default:
        return { saved: '10', searches: '100/mo', exports: '2/mo' };
    }
  };

  const getTierInfo = (): TierInfo => {
    if (!subscription) {
      return { 
        name: 'Free', 
        color: '#6B7280',
        icon: 'star-outline',
        price: null,
        nextBilling: null
      };
    }

    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return null;
      return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    const getPrice = () => {
      if (!subscription.amount) return null;
      
      if (subscription.billingPeriod) {
        return `${subscription.amount.toFixed(2)}/${subscription.billingPeriod === 'yearly' ? 'year' : 'month'}`;
      }
      
      const isYearly = subscription.amount >= 50;
      return `${subscription.amount.toFixed(2)}/${isYearly ? 'year' : 'month'}`;
    };

    switch(subscription.tier) {
      case 'premium':
        return { 
          name: 'Premium', 
          color: '#1B3E6F',
          icon: 'star',
          price: getPrice(),
          nextBilling: formatDate(subscription.nextBillingDate)
        };
      case 'plus':
        return { 
          name: 'Plus', 
          color: '#1B3E6F',
          icon: 'star-half',
          price: getPrice(),
          nextBilling: formatDate(subscription.nextBillingDate)
        };
      default:
        return { 
          name: 'Free', 
          color: '#6B7280',
          icon: 'star-outline',
          price: null,
          nextBilling: null
        };
    }
  };

  return {
    user,
    userLoading,
    subscription,
    currentTier,
    settings,
    collapsedSections,
    stats: getStats(),
    tierInfo: getTierInfo(),
    toggleSection,
    refreshUser,
  };
};
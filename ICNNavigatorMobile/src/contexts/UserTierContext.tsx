import React, { createContext, useContext, useState, ReactNode } from 'react';

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

interface UserTierContextType {
  currentTier: UserTier;
  setCurrentTier: (tier: UserTier) => void;
  features: TierFeatures;
  checkFeatureAccess: (feature: keyof TierFeatures) => boolean;
}

const UserTierContext = createContext<UserTierContextType | undefined>(undefined);

export function UserTierProvider({ children }: { children: ReactNode }) {
  const [currentTier, setCurrentTier] = useState<UserTier>('free');
  const features = TIER_FEATURES[currentTier];

  const checkFeatureAccess = (feature: keyof TierFeatures): boolean => {
    const value = features[feature];
    return typeof value === 'boolean' ? value : value > 0;
  };

  return (
    <UserTierContext.Provider value={{ 
      currentTier, 
      setCurrentTier, 
      features,
      checkFeatureAccess 
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
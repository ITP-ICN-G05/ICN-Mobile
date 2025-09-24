import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';
type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending';

interface Subscription {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  price: number;
  currency: string;
}

interface SubscriptionState {
  currentSubscription: Subscription | null;
  availablePlans: Array<{
    id: string;
    name: string;
    tier: SubscriptionTier;
    price: number;
    features: string[];
  }>;
  isLoading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  currentSubscription: null,
  availablePlans: [],
  isLoading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscription: (state, action: PayloadAction<Subscription>) => {
      state.currentSubscription = action.payload;
      state.error = null;
    },
    updateSubscription: (state, action: PayloadAction<Partial<Subscription>>) => {
      if (state.currentSubscription) {
        state.currentSubscription = { ...state.currentSubscription, ...action.payload };
      }
    },
    clearSubscription: (state) => {
      state.currentSubscription = null;
    },
    setAvailablePlans: (state, action: PayloadAction<SubscriptionState['availablePlans']>) => {
      state.availablePlans = action.payload;
    },
    setSubscriptionLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSubscriptionError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { 
  setSubscription, 
  updateSubscription, 
  clearSubscription, 
  setAvailablePlans,
  setSubscriptionLoading,
  setSubscriptionError
} = subscriptionSlice.actions;
export default subscriptionSlice.reducer;

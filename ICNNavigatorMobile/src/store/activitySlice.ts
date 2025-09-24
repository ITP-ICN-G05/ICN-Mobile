import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActivityLog } from '../types';

interface ActivityState {
  activities: ActivityLog[];
  stats: {
    searchesToday: number;
    savesToday: number;
    exportsToday: number;
    viewsToday: number;
  };
}

const initialState: ActivityState = {
  activities: [],
  stats: {
    searchesToday: 0,
    savesToday: 0,
    exportsToday: 0,
    viewsToday: 0,
  },
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    logActivity: (state, action: PayloadAction<Omit<ActivityLog, 'id' | 'timestamp'>>) => {
      const activity: ActivityLog = {
        ...action.payload,
        id: `activity_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      
      state.activities.unshift(activity);
      
      // Update today's stats
      const today = new Date().toDateString();
      const activityDate = new Date(activity.timestamp).toDateString();
      
      if (today === activityDate) {
        switch (activity.action) {
          case 'search':
            state.stats.searchesToday += 1;
            break;
          case 'save':
            state.stats.savesToday += 1;
            break;
          case 'export':
            state.stats.exportsToday += 1;
            break;
          case 'view':
            state.stats.viewsToday += 1;
            break;
        }
      }
      
      // Keep only last 100 activities
      if (state.activities.length > 100) {
        state.activities = state.activities.slice(0, 100);
      }
    },
    
    resetDailyStats: (state) => {
      state.stats = {
        searchesToday: 0,
        savesToday: 0,
        exportsToday: 0,
        viewsToday: 0,
      };
    },
  },
});

export const { logActivity, resetDailyStats } = activitySlice.actions;

export default activitySlice.reducer;
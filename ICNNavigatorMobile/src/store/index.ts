import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './searchSlice';
import portfolioReducer from './portfolioSlice';
import notificationsReducer from './notificationsSlice';
import activityReducer from './activitySlice';

export const store = configureStore({
  reducer: {
    search: searchReducer,
    portfolio: portfolioReducer,
    notifications: notificationsReducer,
    activity: activityReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { configureStore } from '@reduxjs/toolkit';
import companiesReducer from './companiesSlice';
import searchReducer from './searchSlice';
import portfolioReducer from './portfolioSlice';
import notificationsReducer from './notificationsSlice';
import activityReducer from './activitySlice';

export const store = configureStore({
  reducer: {
    companies: companiesReducer,
    search: searchReducer,
    portfolio: portfolioReducer,
    notifications: notificationsReducer,
    activity: activityReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['companies/setCompanies'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

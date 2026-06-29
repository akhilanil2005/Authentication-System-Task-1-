import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import notificationReducer from "../features/notifications/notificationSlice";
import activityReducer from "../features/activity/activitySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
    activity: activityReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
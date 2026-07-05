import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import notificationReducer from "../features/notifications/notificationSlice";
import activityReducer from "../features/activity/activitySlice";
import rbacReducer from "../features/rbac/rbacSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    activity: activityReducer,
    notifications: notificationReducer,
    rbac: rbacReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
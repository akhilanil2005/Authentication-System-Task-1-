// src/app/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import notificationReducer from "../features/notifications/notificationSlice";
import activityReducer from "../features/activity/activitySlice";
import rbacReducer from "../features/rbac/rbacSlice";
import filesReducer from "../features/files/filesSlice";
import { searchApi } from "../features/search/searchApiSlice";
import { rolesApi } from "../features/search/rolesApiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    activity: activityReducer,
    notifications: notificationReducer,
    rbac: rbacReducer,
    files: filesReducer,
    [rolesApi.reducerPath]: rolesApi.reducer,
    [searchApi.reducerPath]: searchApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(searchApi.middleware, rolesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../api/axios";

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({
    userId,
    page,
  }: {
    userId: number;
    page: number;
  }) => {
    const response = await axios.get(
  `/notifications/${userId}?page=${page}&limit=5`
);

return response.data.notifications;
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id: number) => {
    await axios.put(`/notifications/${id}/read`);
    return id;
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load notifications";
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
  const notification = state.notifications.find(
    (n) => n.id === action.payload
  );

  if (notification) {
    notification.is_read = true;
  }
})
  },
});

export default notificationSlice.reducer;
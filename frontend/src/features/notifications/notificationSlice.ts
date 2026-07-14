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
  totalPages: number;
}

const initialState: NotificationState = {
  notifications: [],
  loading: false,
  error: null,
  totalPages: 1,
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({
    userId,
    page,
    search = "",
  }: {
    userId: number;
    page: number;
    search?: string;
  }) => {
    const response = await axios.get(
      `/notifications/${userId}?page=${page}&limit=5&search=${encodeURIComponent(search)}`
    );
    return response.data;
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
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
  console.log("3. Reducer got:", action.payload);
  state.loading = false;
  state.error = null;
  state.notifications = action.payload.notifications;
  state.totalPages = action.payload.totalPages;
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
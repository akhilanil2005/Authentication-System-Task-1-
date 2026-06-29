import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../api/axios";

export interface Activity {
  id: number;
  action: string;
  created_at: string;
}

export interface ActivityState {
  activities: Activity[];
  loading: boolean;
  error: string | null;
}

const initialState: ActivityState = {
  activities: [],
  loading: false,
  error: null,
};
export const fetchActivities = createAsyncThunk(
  "activity/fetchActivities",
  async (userId: number) => {
    const response = await axios.get(`/activity-logs/${userId}`);
    return response.data;
  }
);
const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload;
      })
      .addCase(fetchActivities.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load activities";
      });
  },
});

export default activitySlice.reducer;
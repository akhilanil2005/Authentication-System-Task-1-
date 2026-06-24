import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, thunkAPI) => {
    try {
      const response = await api.post(
  "/login",
        {
          email,
          password,
        }
      );

      return response.data;
    } catch (error) {
      console.log(error.response?.data);
      if (error.response?.status === 429) {
  return thunkAPI.rejectWithValue(
    "Too many login attempts. Please try again later."
  );
}

return thunkAPI.rejectWithValue(
  error.response?.data?.message ||
  error.response?.data ||
  "Login failed"
);
}
  }
);

const authSlice = createSlice({
  name: "auth",

  initialState: {
    token: localStorage.getItem("token") || null,
    role: localStorage.getItem("role") || null,
    loading: false,
    error: null,
  },

  reducers: {
    setToken: (state, action) => {
      state.token = action.payload.token;
      state.role = action.payload.role;

      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
      localStorage.setItem("role", action.payload.role);
    },

    logout: (state) => {
      state.token = null;
      state.role = null;

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("role");
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.role = action.payload.role;

        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("refreshToken", action.payload.refreshToken);
        localStorage.setItem("role", action.payload.role);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setToken, logout } = authSlice.actions;
export default authSlice.reducer;
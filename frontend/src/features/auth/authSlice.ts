import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

type LoginData = {
  email: string;
  password: string;
};

export const fetchProfile = createAsyncThunk("auth/fetchProfile", async () => {
  const res = await api.get("/profile");
  return res.data.user;
});

export const loginUser = createAsyncThunk<any, LoginData>(
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
    } catch (error: any) {
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
type UserData = {
  id: number;
  name: string;
  email: string;
  role: string;
  roleId: number;
  permissions: string[];
};

const authSlice = createSlice({
  name: "auth",

  initialState: {
    token: localStorage.getItem("token") || null,
    role: localStorage.getItem("role") || null,
    userId: Number(localStorage.getItem("userId")) || null,
    user: null as UserData | null,
    loading: false,
    profileLoading: false,
    error: null as string | null,
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
      state.user = null;
      state.profileLoading = false;

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("role");
    },
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userId = action.payload.userId;
        state.token = action.payload.token;
        state.role = action.payload.role;

        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("refreshToken", action.payload.refreshToken);
        localStorage.setItem("role", action.payload.role);
        localStorage.setItem("userId", action.payload.userId.toString());
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProfile.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.profileLoading = false;
        state.user = null;
      });
  },
});

export const { setToken, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
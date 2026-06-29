import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../../services/authService";

// Load user from localStorage on app start (key: "user", matches project convention)
const storedUser = JSON.parse(localStorage.getItem("user"));

const initialState = {
  user: storedUser || null, // { token, id, name, email, role, phone, profileImage }
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// Helper to flatten the API's { token, user: {...} } response into one object
// and persist it to localStorage under the "user" key.
const persistUser = (token, userObj) => {
  const flatUser = { token, ...userObj };
  localStorage.setItem("user", JSON.stringify(flatUser));
  return flatUser;
};

export const registerAdmin = createAsyncThunk(
  "auth/registerAdmin",
  async (data, thunkAPI) => {
    try {
      const res = await authService.register(data);
      return persistUser(res.data.token, res.data.user);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Registration failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const login = createAsyncThunk("auth/login", async (data, thunkAPI) => {
  try {
    const res = await authService.login(data);
    return persistUser(res.data.token, res.data.user);
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Login failed";
    return thunkAPI.rejectWithValue(message);
  }
});

export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, thunkAPI) => {
  try {
    const res = await authService.getMe();
    const current = JSON.parse(localStorage.getItem("user"));
    const merged = { ...current, ...res.data.user };
    localStorage.setItem("user", JSON.stringify(merged));
    return merged;
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Failed to fetch profile";
    return thunkAPI.rejectWithValue(message);
  }
});

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (data, thunkAPI) => {
    try {
      const res = await authService.forgotPassword(data);
      return res.data.message;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Request failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ resetToken, password }, thunkAPI) => {
    try {
      const res = await authService.resetPassword(resetToken, { password });
      return persistUser(res.data.token, res.data.user);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Reset failed";
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("user");
      state.user = null;
    },
    resetAuthStatus: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // register
      .addCase(registerAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })

      // login
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })

      // fetch profile
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })

      // forgot password
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload;
      })

      // reset password
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })

      // pending matcher
      .addMatcher(
        (action) =>
          action.type.startsWith("auth/") &&
          action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.isError = false;
          state.isSuccess = false;
        }
      )

      // rejected matcher
      .addMatcher(
        (action) =>
          action.type.startsWith("auth/") &&
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload;
        }
      );
  }
});

export const { logout, resetAuthStatus } = authSlice.actions;
export default authSlice.reducer;

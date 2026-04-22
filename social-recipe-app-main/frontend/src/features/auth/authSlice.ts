import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  profilePictureUrl?: string;
  coverPictureUrl?: string;
  roles: string[];
  premium?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const token = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');
let parsedUser = null;
if (storedUser) {
  try {
    parsedUser = JSON.parse(storedUser);
    // Migration: rename isPremiumUser to premium if found
    if (parsedUser && 'isPremiumUser' in parsedUser) {
      parsedUser.premium = parsedUser.isPremiumUser;
      delete parsedUser.isPremiumUser;
      localStorage.setItem('user', JSON.stringify(parsedUser));
    }
  } catch (e) {
    console.error('Failed to parse stored user', e);
  }
}

const initialState: AuthState = {
  user: parsedUser,
  token: token || null,
  isAuthenticated: !!token,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.loading = false;
      const user = action.payload.user;
      // Normalization: Ensure 'premium' key is used
      const legacyUser = user as User & { isPremiumUser?: boolean };
      if (legacyUser && 'isPremiumUser' in legacyUser) {
         user.premium = legacyUser.isPremiumUser;
      }
      state.user = user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    loginFailure(state, action: PayloadAction<string | { message?: string; error?: string } | undefined>) {
      state.loading = false;
      const payload = action.payload;
      state.error = typeof payload === 'string' 
        ? payload 
        : (payload?.message || payload?.error || 'An error occurred');
      state.isAuthenticated = false;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError(state) {
      state.error = null;
    },
    upgradeSuccess(state) {
      if (state.user) {
        state.user.premium = true;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, clearError, upgradeSuccess, updateUser } = authSlice.actions;
export default authSlice.reducer;

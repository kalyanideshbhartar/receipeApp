import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '../../services/user.service';

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchProfileStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchProfileSuccess(state, action: PayloadAction<UserProfile>) {
      state.loading = false;
      state.profile = action.payload;
    },
    fetchProfileFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    toggleFollow(state) {
      if (state.profile) {
        state.profile.isFollowing = !state.profile.isFollowing;
        state.profile.followerCount += state.profile.isFollowing ? 1 : -1;
      }
    },
    updateProfileSuccess(state, action: PayloadAction<UserProfile>) {
      state.loading = false;
      state.profile = action.payload;
    }
  },
});

export const { 
  fetchProfileStart, fetchProfileSuccess, fetchProfileFailure, 
  toggleFollow, updateProfileSuccess 
} = userSlice.actions;
export default userSlice.reducer;

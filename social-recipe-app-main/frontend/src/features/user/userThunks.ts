import type { AppDispatch } from '../../store/store';
import { userService } from '../../services/user.service';
import { 
  fetchProfileStart, fetchProfileSuccess, fetchProfileFailure, 
  toggleFollow, updateProfileSuccess 
} from './userSlice';

export const getProfileThunk = (userId: number) => async (dispatch: AppDispatch) => {
  dispatch(fetchProfileStart());
  try {
    const data = await userService.getProfile(userId);
    dispatch(fetchProfileSuccess(data));
  } catch (err: unknown) {
    const error = err as { response?: { data?: string | { error?: string } } };
    const data = error.response?.data;
    const message = (typeof data === 'object' ? data?.error : data) || 'Failed to fetch profile';
    dispatch(fetchProfileFailure(typeof message === 'string' ? message : JSON.stringify(message)));
  }
};

export const followUserThunk = (userId: number) => async (dispatch: AppDispatch) => {
  dispatch(toggleFollow());
  try {
    await userService.followUser(userId);
  } catch {
    dispatch(toggleFollow());
    console.error('Follow failed');
  }
};

export const unfollowUserThunk = (userId: number) => async (dispatch: AppDispatch) => {
  dispatch(toggleFollow());
  try {
    await userService.unfollowUser(userId);
  } catch {
    dispatch(toggleFollow());
    console.error('Unfollow failed');
  }
};

export const updateProfileThunk = (data: { bio?: string; profilePictureUrl?: string; coverPictureUrl?: string }) => async (dispatch: AppDispatch) => {
  dispatch(fetchProfileStart());
  try {
    const updatedProfile = await userService.updateProfile(data);
    dispatch(updateProfileSuccess(updatedProfile));
  } catch (err: unknown) {
    const error = err as { response?: { data?: string | { error?: string } } };
    const data = error.response?.data;
    const message = (typeof data === 'object' ? data?.error : data) || 'Failed to update profile';
    dispatch(fetchProfileFailure(typeof message === 'string' ? message : JSON.stringify(message)));
    throw err;
  }
};

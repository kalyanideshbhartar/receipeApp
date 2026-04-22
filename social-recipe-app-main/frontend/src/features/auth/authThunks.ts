import type { AppDispatch } from '../../store/store';
import { authService } from '../../services/auth.service';
import type { LoginPayload, RegisterPayload } from '../../services/auth.service';
import { loginStart, loginSuccess, loginFailure } from './authSlice';

export const loginThunk = (payload: LoginPayload) => async (dispatch: AppDispatch) => {
  dispatch(loginStart());
  try {
    const data = await authService.login(payload);
    dispatch(loginSuccess({
      user: { 
        id: data.id, 
        username: data.username, 
        fullName: data.fullName,
        email: data.email, 
        roles: data.roles, 
        premium: data.premium ?? false 
      },
      token: data.token,
    }));
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string; error?: string } } };
    const data = error.response?.data;
    const message = data?.message || data?.error || 'Login failed. Please try again.';
    dispatch(loginFailure(typeof message === 'string' ? message : 'Login failed'));
  }
};

export const registerThunk = (payload: RegisterPayload) => async (dispatch: AppDispatch) => {
  dispatch(loginStart());
  try {
    await authService.register(payload);
    // Auto-login after registration
    await dispatch(loginThunk({ username: payload.username, password: payload.password }));
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string; error?: string } } };
    const data = error.response?.data;
    const message = data?.message || data?.error || 'Registration failed. Please try again.';
    dispatch(loginFailure(typeof message === 'string' ? message : 'Registration failed'));
  }
};

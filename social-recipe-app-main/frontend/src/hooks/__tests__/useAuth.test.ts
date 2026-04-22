import { useAuth } from '../useAuth';
import { useSelector, useDispatch } from 'react-redux';

// Mock react-redux
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Mock logout action
jest.mock('../../features/auth/authSlice', () => ({
  logout: jest.fn(() => ({ type: 'auth/logout' })),
}));

describe('useAuth hook', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
  });

  test('returns authentication state from Redux store', () => {
    const mockUser = { id: 1, username: 'testuser' };
    (useSelector as unknown as jest.Mock).mockImplementation((selector) => 
      selector({
        auth: {
          user: mockUser,
          token: 'mock-token',
          isAuthenticated: true,
          loading: false,
          error: null,
        }
      })
    );

    const { user, isAuthenticated, token } = useAuth();

    expect(user).toEqual(mockUser);
    expect(isAuthenticated).toBe(true);
    expect(token).toBe('mock-token');
  });

  test('signOut dispatches logout action', () => {
    const { signOut } = useAuth();
    signOut();

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/logout' });
  });

  test('returns loading and error states', () => {
    (useSelector as unknown as jest.Mock).mockImplementation((selector) => 
      selector({
        auth: {
          user: null,
          token: null,
          isAuthenticated: false,
          loading: true,
          error: 'Login failed',
        }
      })
    );

    const { loading, error } = useAuth();

    expect(loading).toBe(true);
    expect(error).toBe('Login failed');
  });
});

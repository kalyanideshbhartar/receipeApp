import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LoginPage from './LoginPage';
import authReducer from '../../features/auth/authSlice';
import '@testing-library/jest-dom';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

const renderWithProviders = (ui: React.ReactElement, { preloadedState = {} } = {}) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState,
  });
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </Provider>
  );
};

describe('LoginPage', () => {
  test('renders login form correctly', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Username or Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  test('shows validation errors when fields are empty', async () => {
    renderWithProviders(<LoginPage />);
    
    const signInButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(signInButton);

    expect(await screen.findByText(/Username or Email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
  });

  test('shows error message from auth state', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: {
        auth: {
          error: 'Invalid credentials',
          loading: false,
          isAuthenticated: false,
          user: null,
          token: null
        }
      }
    });

    expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
  });

  test('shows loading spinner when auth is loading', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: {
        auth: {
          loading: true,
          error: null,
          isAuthenticated: false,
          user: null,
          token: null
        }
      }
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

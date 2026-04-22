import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RegisterPage from './RegisterPage';
import authReducer from '../../features/auth/authSlice';
import '@testing-library/jest-dom';

// Mock dependencies
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

describe('RegisterPage', () => {
  test('renders register form correctly', () => {
    renderWithProviders(<RegisterPage />);
    
    expect(screen.getByText(/Join our community/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Chef_Explorer/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  test('shows validation errors when fields are empty', async () => {
    renderWithProviders(<RegisterPage />);
    
    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
  });

  test('shows error when passwords do not match', async () => {
    renderWithProviders(<RegisterPage />);
    
    fireEvent.change(screen.getByPlaceholderText(/Chef_Explorer/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), { target: { value: 'test@example.com' } });
    
    const passwordInputs = screen.getAllByPlaceholderText(/••••••••/i);
    fireEvent.change(passwordInputs[0], { target: { value: 'Password@123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'Different@123' } });

    const submitButton = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  test('shows error message from auth state', () => {
    renderWithProviders(<RegisterPage />, {
      preloadedState: {
        auth: {
          error: 'Username already taken',
          loading: false,
          isAuthenticated: false,
          user: null,
          token: null
        }
      }
    });

    expect(screen.getByText(/Username already taken/i)).toBeInTheDocument();
  });
});

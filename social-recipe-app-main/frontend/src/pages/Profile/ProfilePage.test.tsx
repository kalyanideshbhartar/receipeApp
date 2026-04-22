// Mock dependencies first
jest.mock('../../hooks/useAuth');
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';

// Mock child components
jest.mock('../../components/home/CommunitySidebar', () => () => <div data-testid="sidebar">Sidebar</div>);
jest.mock('../../components/profile/EditProfileModal', () => () => <div data-testid="edit-modal">EditProfileModal</div>);
jest.mock('../../components/recipes/RecipeCard', () => () => <div data-testid="recipe-card">RecipeCard</div>);

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

// Mock Services
jest.mock('../../services/user.service');
jest.mock('../../services/recipe.service');

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from './ProfilePage';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user.service';
import { recipeService } from '../../services/recipe.service';
import '@testing-library/jest-dom';

const mockUser = {
  id: 1,
  username: 'testchef',
  profilePictureUrl: 'test.jpg',
  followerCount: 100,
  followingCount: 50,
  bio: 'Test Bio',
  isVerified: true,
  isFollowing: false,
  recipeCount: 0,
  roles: []
};

describe('ProfilePage', () => {
  const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    const store = configureStore({
      reducer: { auth: authReducer },
    });
    return render(
      <Provider store={store}>
        {ui}
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 1, username: 'testuser', roles: [] } });
    (userService.getProfile as jest.Mock).mockResolvedValue(mockUser);
    (recipeService.getUserRecipes as jest.Mock).mockResolvedValue({ content: [], nextCursor: null });
    (recipeService.getUserLikedRecipes as jest.Mock).mockResolvedValue({ content: [], nextCursor: null });
  });

  test('renders profile information correctly', async () => {
    const testQueryClient = createTestQueryClient();
    renderWithProviders(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={['/profile/1']}>
          <Routes>
            <Route path="/profile/:id" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(await screen.findByRole('heading', { name: 'testchef', level: 2 })).toBeInTheDocument();
    expect(await screen.findByText('100')).toBeInTheDocument();
  });

  test('shows loading state initially', async () => {
    const testQueryClient = createTestQueryClient();
    (userService.getProfile as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    renderWithProviders(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={['/profile/1']}>
          <Routes>
            <Route path="/profile/:id" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(await screen.findByTestId('profile-loading')).toBeInTheDocument();
  });

  test('displays error message when user not found', async () => {
    const testQueryClient = createTestQueryClient();
    (userService.getProfile as jest.Mock).mockRejectedValue(new Error('User not found'));
    
    renderWithProviders(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={['/profile/1']}>
          <Routes>
            <Route path="/profile/:id" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(await screen.findByText(/User not found/i)).toBeInTheDocument();
  });
});

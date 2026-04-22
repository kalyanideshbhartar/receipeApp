import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecipeDetailPage from './RecipeDetailPage';
import { recipeService } from '../../services/recipe.service';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('../../services/recipe.service');
jest.mock('../../hooks/useAuth');
jest.mock('../../hooks/useWebSocket');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

const mockRecipeDetail = {
  id: 1,
  title: 'Gourmet Pasta',
  description: 'Exquisite culinary delight',
  author: { username: 'chef1', profilePictureUrl: 'chef.jpg' },
  ingredients: [{ id: 1, name: 'Pasta', quantity: '200', unit: 'g' }],
  steps: [{ id: 1, stepNumber: 1, instruction: 'Boil water' }],
  imageUrl: 'pasta.jpg',
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  servings: 2,
  likeCount: 10,
  commentCount: 5,
  isLiked: false,
  isBookmarked: false,
  createdAt: new Date().toISOString()
};

describe('RecipeDetailPage', () => {
  const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { username: 'testuser', roles: [] } });
    (useWebSocket as jest.Mock).mockReturnValue({
      subscribeToRecipe: jest.fn(() => jest.fn()),
      recipeStats: {},
      viewerCounts: {},
    });
    (recipeService.getRecipeById as jest.Mock).mockResolvedValue(mockRecipeDetail);
    (recipeService.getComments as jest.Mock).mockResolvedValue({ content: [] });
  });

  test('renders recipe details correctly', async () => {
    const testQueryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={['/recipes/1']}>
          <Routes>
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(await screen.findByText('Gourmet Pasta')).toBeInTheDocument();
    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Boil water')).toBeInTheDocument();
  });

  test('shows 404 page when recipe not found', async () => {
    const testQueryClient = createTestQueryClient();
    (recipeService.getRecipeById as jest.Mock).mockRejectedValue(new Error('Not found'));
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={['/recipes/1']}>
          <Routes>
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(await screen.findByText(/Recipe Not Found/i)).toBeInTheDocument();
  });

  test('shows loading state', async () => {
    const testQueryClient = createTestQueryClient();
    (recipeService.getRecipeById as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    render(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter initialEntries={['/recipes/1']}>
          <Routes>
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(await screen.findByTestId('recipe-loading')).toBeInTheDocument();
  });
});

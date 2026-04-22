import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RecipeCard from './RecipeCard';
import '@testing-library/jest-dom';

// Mock dependecies
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, username: 'testuser' }
  })
}));

jest.mock('../../pages/Recipe/AddToPlannerModal', () => {
  return function MockAddToPlannerModal() {
    return <div data-testid="planner-modal">Planner Modal</div>;
  };
});

jest.mock('./QuickCommentModal', () => {
  return function MockQuickCommentModal({ open, onClose }: { open: boolean, onClose: () => void }) {
    if (!open) return null;
    return (
      <div data-testid="quick-comment-modal">
        Quick Comment Modal
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock QueryClient
jest.mock('@tanstack/react-query', () => {
  const original = jest.requireActual('@tanstack/react-query');
  return {
    ...original,
    useQueryClient: () => ({
      invalidateQueries: jest.fn(),
    }),
    useMutation: ({ mutationFn, onSuccess }: { mutationFn: (...args: unknown[]) => Promise<unknown>, onSuccess?: () => void }) => {
      const mutate = async (...args: unknown[]) => {
        await mutationFn(...args);
        onSuccess?.();
      };
      return { mutate, isPending: false };
    },
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const mockRecipe = {
  id: 1,
  title: 'Delicious Pasta',
  description: 'A classic Italian pasta recipe.',
  imageUrl: 'test-image.jpg',
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  servings: 2,
  likeCount: 5,
  commentCount: 2,
  isLiked: false,
  isBookmarked: false,
  category: 'Italian',
  createdAt: new Date().toISOString(),
  author: {
    id: 1,
    username: 'chef123',
    profilePictureUrl: 'chef.jpg',
    isVerified: true
  }
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('RecipeCard', () => {
  test('renders recipe details correctly', () => {
    renderWithRouter(<RecipeCard recipe={mockRecipe} />);
    
    expect(screen.getByText('Delicious Pasta')).toBeInTheDocument();
    expect(screen.getByText('A classic Italian pasta recipe.')).toBeInTheDocument();
    expect(screen.getByText('chef123')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument(); // 10 + 20
    expect(screen.getByText('5')).toBeInTheDocument(); // likes
  });

  test('calls onLike when like button is clicked', () => {
    const onLikeMock = jest.fn();
    renderWithRouter(<RecipeCard recipe={mockRecipe} onLike={onLikeMock} />);
    
    const likeButton = screen.getByTestId('like-button');
    fireEvent.click(likeButton);
    expect(onLikeMock).toHaveBeenCalledWith(mockRecipe.id);
  });

  test('calls onDelete when delete button is clicked', () => {
    const onDeleteMock = jest.fn();
    // Author is testuser (id: 1)
    renderWithRouter(<RecipeCard recipe={mockRecipe} onDelete={onDeleteMock} />);
    
    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);
    expect(onDeleteMock).toHaveBeenCalledWith(mockRecipe.id);
  });

  test('opens quick comment modal when chat icon is clicked', () => {
    renderWithRouter(<RecipeCard recipe={mockRecipe} />);
    
    const chatButton = screen.getByTestId('comment-button');
    fireEvent.click(chatButton);
    expect(screen.getByTestId('quick-comment-modal')).toBeInTheDocument();
  });
});

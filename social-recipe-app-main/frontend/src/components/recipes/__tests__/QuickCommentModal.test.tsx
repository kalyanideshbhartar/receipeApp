import { render, screen, fireEvent } from '@testing-library/react';
import QuickCommentModal from '../QuickCommentModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('QuickCommentModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly when open', () => {
    renderWithProviders(
      <QuickCommentModal 
        open={true} 
        onClose={mockOnClose} 
        recipeId={1} 
        recipeTitle="Test Recipe" 
        authorName="Chef" 
      />
    );

    expect(screen.getByText('Quick Thought')).toBeInTheDocument();
    expect(screen.getByText('On Test Recipe by @Chef')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/What's on your mind/)).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', () => {
    renderWithProviders(
      <QuickCommentModal 
        open={true} 
        onClose={mockOnClose} 
        recipeId={1} 
        recipeTitle="Test Recipe" 
        authorName="Chef" 
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('does not render when closed', () => {
    const { container } = renderWithProviders(
      <QuickCommentModal 
        open={false} 
        onClose={mockOnClose} 
        recipeId={1} 
        recipeTitle="Test Recipe" 
        authorName="Chef" 
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});

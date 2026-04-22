import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Alert, Grid } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RecipeCard from '../../components/recipes/RecipeCard';
import FeaturedRecipeCarousel from '../../components/discovery/FeaturedRecipeCarousel';
import CategoryQuickBar from '../../components/discovery/CategoryQuickBar';
import FilterSidebar from '../../components/discovery/FilterSidebar';
import { recipeService } from '../../services/recipe.service';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../features/auth/authSlice';

const FeedPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filters, setFilters] = useState({
    maxTime: 180,
    maxCalories: 2000,
    sort: ['newest'] as string[]
  });

  const handleFilterReset = () => {
    setFilters({ maxTime: 180, maxCalories: 2000, sort: ['newest'] });
    setSelectedCategory('');
  };

  // --- Search Results (Static Query) ---
  const { 
    data: searchData, 
    isLoading: isSearchLoading, 
    error: searchError 
  } = useQuery({
    queryKey: ['recipes', 'search', searchQuery],
    queryFn: () => recipeService.searchRecipes(searchQuery!),
    enabled: !!searchQuery,
  });

  // --- Explore Feed (Infinite Query) ---
  const {
    data: exploreData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isExploreLoading,
    error: exploreError,
  } = useInfiniteQuery({
    queryKey: ['recipes', 'explore', selectedCategory, filters],
    queryFn: async ({ pageParam }) => {
      if (selectedCategory === 'OWN' && user) {
        return recipeService.getUserRecipes((user as User).id, pageParam as string, 12);
      }
      return recipeService.getExploreFeed(
        pageParam as string, 
        selectedCategory, 
        12, 
        filters.maxTime, 
        filters.maxCalories, 
        filters.sort.join(',')
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !searchQuery,
  });

  // Flatten explore recipes
  const exploreFeed = useMemo(() => 
    exploreData?.pages.flatMap(page => page.content) || [], 
    [exploreData]
  );

  // --- Scroll Listener for Infinite Scroll ---
  useEffect(() => {
    if (searchQuery) return;

    const handleScroll = () => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200;
      if (isAtBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, searchQuery]);

  // --- Mutations ---
  const likeMutation = useMutation({
    mutationFn: (id: number) => recipeService.likeRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: () => toast.error('Failed to like recipe'),
  });

  const bookmarkMutation = useMutation({
    mutationFn: (id: number) => recipeService.bookmarkRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      // We could be more specific but this ensures all feeds stay synced
    },
    onError: () => toast.error('Failed to bookmark recipe'),
  });

  const handleLike = (id: number) => likeMutation.mutate(id);
  const handleBookmark = (id: number) => bookmarkMutation.mutate(id);

  const deleteRecipeMutation = useMutation({
    mutationFn: (id: number) => recipeService.deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe deleted successfully');
    },
    onError: () => toast.error('Failed to delete recipe'),
  });

  const handleDeleteRecipe = (id: number) => {
    if (window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      deleteRecipeMutation.mutate(id);
    }
  };

  const currentLoading = searchQuery ? isSearchLoading : isExploreLoading;
  const currentError = searchQuery 
    ? (searchError as { message?: string })?.message 
    : (exploreError as { message?: string })?.message;
  const displayFeed = searchQuery ? (searchData || []) : exploreFeed;

  return (
    <Box sx={{ minHeight: '100vh', pt: { xs: 4, md: 6 }, pb: 8, bgcolor: 'background.default' }}>
      <Container maxWidth="xl">
        {!searchQuery && displayFeed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <FeaturedRecipeCarousel />
          </motion.div>
        )}

        <CategoryQuickBar 
          selectedCategory={selectedCategory} 
          onSelect={setSelectedCategory} 
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.165, 0.84, 0.44, 1] }}
        >
          <Box sx={{ mb: { xs: 6, md: 8 }, textAlign: 'center' }}>
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontWeight: 900,
                mb: 2,
                letterSpacing: '-0.05em',
                lineHeight: 1.1,
                color: 'primary.main'
              }}
            >
              {searchQuery ? (
                <>Results for <span style={{ color: '#E67E22' }}>"{searchQuery}"</span></>
              ) : (
                <>Elevate Your <br/><span style={{ color: '#E67E22' }}>Culinary Journey</span></>
              )}
            </Typography>
            {!searchQuery && (
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  maxWidth: 800, mx: 'auto', fontWeight: 500, 
                  fontSize: { xs: '1rem', md: '1.2rem' }, lineHeight: 1.6, opacity: 0.8
                }}
              >
                Explore expert recipes, master new techniques, and share your passion with a professional community.
              </Typography>
            )}
          </Box>
        </motion.div>

        {currentError && (
          <Alert 
            severity="error" 
            variant="outlined" 
            sx={{ mb: 6, borderRadius: 4, bgcolor: '#fff1f2' }}
          >
            {currentError}
          </Alert>
        )}

        <Grid container spacing={5}>
          <Grid size={{ md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            {!searchQuery && (
              <FilterSidebar 
                filters={filters} 
                onFilterChange={setFilters} 
                onReset={handleFilterReset} 
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, md: searchQuery ? 12 : 9 }}>
            <AnimatePresence mode="popLayout">
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 6,
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  '& > *': {
                    flexBasis: { 
                      xs: '100%', 
                      sm: 'calc(50% - 24px)', 
                      md: 'calc(50% - 24px)',
                      lg: 'calc(33.333% - 32px)',
                      xl: '320px'
                    },
                    flexGrow: 0,
                    flexShrink: 0
                  }
                }}
              >
                {displayFeed.map((recipe, index) => (
                  <motion.div
                    key={`${recipe.id}-${index}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: (index % 8) * 0.1 }}
                    layout
                    style={{ height: 'auto', display: 'flex' }}
                  >
                    <RecipeCard 
                      recipe={recipe} 
                      onLike={handleLike} 
                      onBookmark={handleBookmark}
                      onDelete={handleDeleteRecipe}
                    />
                  </motion.div>
                ))}
              </Box>
            </AnimatePresence>

            {currentLoading || isFetchingNextPage ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress size={48} thickness={5} sx={{ color: 'primary.main' }} />
              </Box>
            ) : hasNextPage && !searchQuery ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                 <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.6 }}>
                  Discovering more...
                </Typography>
              </Box>
            ) : null}

            {!currentLoading && displayFeed.length === 0 && !currentError && (
              <Box sx={{ textAlign: 'center', py: 15, borderRadius: 8, border: '2px dashed #e2e8f0' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.secondary' }}>
                  No culinary treasures found.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default FeedPage;
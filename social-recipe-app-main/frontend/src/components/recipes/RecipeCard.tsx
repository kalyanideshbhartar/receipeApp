import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Card, CardContent, CardMedia, Typography, 
  Box, Avatar, IconButton, Chip, Rating
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import { motion } from 'framer-motion';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import StarIcon from '@mui/icons-material/Star';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../features/auth/authSlice';
import AddToPlannerModal from '../../pages/Recipe/AddToPlannerModal';
import { recipeService, type RecipeSummary } from '../../services/recipe.service';
import QuickCommentModal from './QuickCommentModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RecipeCardProps {
  recipe: RecipeSummary;
  onLike?: (id: number) => void;
  onBookmark?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const RecipeCard = ({ recipe, onLike, onBookmark, onDelete }: RecipeCardProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const premium = Boolean((user as User | null)?.premium);
  
  // DIAGNOSTIC LOG: Help verify premium status sync
  useEffect(() => {
    if (isAuthenticated && recipe.isPremium) {
      console.log(`[RecipeCard] Recipe "${recipe.title}" is PREMIUM. User "${user?.username}" premium status: ${premium}`);
    }
  }, [isAuthenticated, recipe.isPremium, recipe.title, user?.username, premium]);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  const rateMutation = useMutation({
    mutationFn: (rating: number) => recipeService.rateRecipe(recipe.id, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Rating submitted! ⭐');
    },
    onError: () => toast.error('Failed to submit rating'),
  });

  const handleRate = (e: React.SyntheticEvent | Event, newValue: number | null) => {
    e.stopPropagation();
    if (!isAuthenticated) return navigate('/login');
    if (!newValue) return;
    if ((user as User | null)?.id === recipe.author?.id) {
        toast.error("You can't rate your own masterpiece! 😉");
        return;
    }
    rateMutation.mutate(newValue);
  };

  const handleNavigate = () => {
    const isAuthor = (user as User | null)?.id === recipe.author?.id;
    if (recipe.isPremium && !isAuthor && !premium) {
      toast.error('This is a Premium Recipe. Please upgrade to view.', {
        icon: '💎',
        duration: 3000
      });
      return;
    }
    navigate(`/recipes/${recipe.id}`);
  };

  const handleInteraction = (e: React.MouseEvent, callback?: (id: number) => void) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    callback?.(recipe.id);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%', display: 'flex', width: '100%' }}
    >
      <Card 
        sx={{ 
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 1.25,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
          transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
          '&:hover': { 
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            transform: 'translateY(-8px)',
            borderColor: 'primary.light',
            '& .card-media': { transform: 'scale(1.1)' }
          }
        }}
      >
        {/* Media Section */}
        <Box sx={{ position: 'relative', pt: '100%', overflow: 'hidden', bgcolor: 'grey.100' }}>
          {recipe.imageUrl ? (
            <CardMedia
              component="img"
              className="card-media"
              image={recipe.imageUrl}
              alt={recipe.title}
              sx={{ 
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                transition: 'transform 0.5s ease', cursor: 'pointer',
                objectFit: 'cover'
              }}
              onClick={handleNavigate}
            />
          ) : (
            <Box 
              sx={{ 
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                cursor: 'pointer'
              }}
              onClick={handleNavigate}
            >
              <RestaurantMenuIcon sx={{ fontSize: 48, color: 'primary.light', mb: 1, opacity: 0.5 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                No Image Provided
              </Typography>
            </Box>
          )}
          
          <Box sx={{ 
            position: 'absolute', top: 12, left: 12,
            bgcolor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            color: 'white',
            px: 1.5, py: 0.5, borderRadius: '6px', zIndex: 1,
            display: 'flex', alignItems: 'center', gap: 0.75,
          }}>
            <AccessTimeIcon sx={{ fontSize: 14, color: 'white' }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'white', letterSpacing: '0.02em' }}>
              {(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min
            </Typography>
          </Box>

          {/* Premium Badge (Always top priority) */}
          {recipe.isPremium && (
            <Box sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 10,
              background: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
              color: 'black',
              px: 1.2,
              py: 0.4,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              boxShadow: '0 4px 12px rgba(184, 134, 11, 0.4)',
              border: '1px solid rgba(255,255,255,0.4)',
              animation: 'pulse 2s infinite'
            }}>
              <StarIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 950, letterSpacing: '0.05em' }}>PREMIUM</Typography>
            </Box>
          )}

          <IconButton
            size="small"
            data-testid="bookmark-button"
            onClick={(e) => handleInteraction(e, onBookmark)}
            sx={{ 
              position: 'absolute', 
              top: recipe.isPremium ? 55 : 12, 
              right: 12,
              bgcolor: 'rgba(255,255,255,0.9)', 
              zIndex: 4,
              '&:hover': { bgcolor: 'white' },
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              color: recipe.isBookmarked ? 'primary.main' : 'inherit',
              transition: 'all 0.3s ease'
            }}
          >
            {recipe.isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
          </IconButton>

          {/* Delete Button for Author/Admin */}
          {(onDelete && ((user as User | null)?.id === recipe.author?.id || (user as User | null)?.roles?.includes('ROLE_ADMIN'))) && (
            <IconButton
              size="small"
              data-testid="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(recipe.id);
              }}
              sx={{ 
                position: 'absolute', 
                top: recipe.isPremium ? 98 : 55, 
                right: 12,
                bgcolor: 'rgba(255,255,255,0.9)', 
                zIndex: 4,
                '&:hover': { bgcolor: '#fee2e2', color: 'error.main' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                color: 'text.secondary',
                transition: 'all 0.3s ease'
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}

          {/* Lock Overlay for non-premium users */}
          {recipe.isPremium && !premium && (
            <Box sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
              zIndex: 2,
              borderRadius: '24px 24px 0 0'
            }}>
              <Box sx={{ 
                bgcolor: 'white', 
                p: 2, 
                borderRadius: '50%', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                display: 'flex'
              }}>
                <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 32 }} />
              </Box>
            </Box>
          )}
        </Box>

        <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Author */}
          <Box 
            sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
            onClick={(e) => {
              e.stopPropagation();
              if (recipe.author?.id) {
                navigate(`/profile/${recipe.author.id}`);
              }
            }}
          >
            <Avatar 
              src={recipe.author?.profilePictureUrl} 
              sx={{ width: 22, height: 22, border: '1px solid #eee' }}
            >
              {recipe.author?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {recipe.author?.username}
              {recipe.author?.isVerified && <VerifiedIcon sx={{ fontSize: 14, color: 'primary.main' }} />}
            </Typography>
          </Box>

          {/* Premium Label */}
          {recipe.isPremium && (
            <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
               <WorkspacePremiumIcon sx={{ fontSize: 16, color: '#B8860B' }} />
               <Typography 
                 variant="caption" 
                 sx={{ 
                   color: '#B8860B', 
                   fontWeight: 900, 
                   fontSize: '0.75rem', 
                   textTransform: 'uppercase', 
                   letterSpacing: '0.05em' 
                 }}
               >
                 Premium Experience
               </Typography>
            </Box>
          )}

          {/* Title - Fixed height for consistency */}
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 800, 
              lineHeight: 1.3,
              mb: 1,
              height: '2.6em', // strictly 2 lines
              fontSize: '1.1rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              cursor: 'pointer',
              color: 'primary.main',
              '&:hover': { color: 'secondary.main' }
            }}
            onClick={handleNavigate}
          >
            {recipe.title}
          </Typography>

          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating 
              value={recipe.averageRating || 0} 
              precision={0.5} 
              onChange={handleRate}
              readOnly={!isAuthenticated || (user as User | null)?.id === recipe.author?.id} 
              size="small" 
              sx={{ 
                color: 'primary.main', 
                fontSize: '1rem',
                '&.Mui-disabled': { opacity: 1 } // Keep it visible even when disabled
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              {recipe.averageRating?.toFixed(1) || '0.0'}
            </Typography>
          </Box>

          {/* Description - Fixed height for consistency */}
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              mb: 2,
              height: '3em', // strictly 2 lines
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '0.85rem',
              lineHeight: 1.5
            }}
          >
            {recipe.description || 'A delicious culinary creation prepared with the finest ingredients and professional techniques.'}
          </Typography>

          <Box sx={{ mt: 'auto', pt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton 
                  size="small" 
                  data-testid="like-button"
                  onClick={(e) => handleInteraction(e, onLike)}
                  sx={{ 
                    p: 0,
                    color: recipe.isLiked ? 'secondary.main' : 'text.disabled',
                    '&:hover': { color: 'secondary.main' }
                  }}
                >
                  {recipe.isLiked ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                </IconButton>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {recipe.likeCount}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                <IconButton 
                  size="small" 
                  data-testid="comment-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) return navigate('/login');
                    setIsCommentModalOpen(true);
                  }}
                  sx={{ p: 0, color: 'inherit', '&:hover': { color: 'primary.main' } }}
                >
                  <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {recipe.commentCount}
                </Typography>
              </Box>
            </Box>
            
            <Chip 
              label={recipe.category || 'Expert'} 
              size="small" 
              sx={{ 
                height: 20, 
                fontSize: '0.65rem', 
                fontWeight: 700,
                bgcolor: '#F2F4F4',
                color: 'primary.main',
                borderRadius: 1
              }} 
            />
          </Box>
        </CardContent>
      </Card>

      <AddToPlannerModal 
        open={isPlannerOpen} 
        onClose={() => setIsPlannerOpen(false)}
        recipeId={recipe.id}
        recipeTitle={recipe.title}
      />

      <QuickCommentModal 
        open={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        recipeId={recipe.id}
        recipeTitle={recipe.title}
        authorName={recipe.author?.username || 'Chef'}
      />
    </motion.div>
  );
};

export default RecipeCard;

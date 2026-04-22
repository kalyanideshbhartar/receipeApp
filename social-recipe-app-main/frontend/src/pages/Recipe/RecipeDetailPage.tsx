import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Grid, Box, Typography, Avatar, 
  List, ListItem, ListItemText, ListItemIcon, 
  Paper, IconButton, TextField, Button, CircularProgress, 
  Stack, Rating, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import api from '../../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

import DescriptionIcon from '@mui/icons-material/Description';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { userService } from '../../services/user.service';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../features/auth/authSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import { recipeService, type Comment } from '../../services/recipe.service';
import AddToPlannerModal from './AddToPlannerModal';
import { toast } from 'react-hot-toast';

interface CommentItemProps {
  comment: Comment & { userProfilePictureUrl?: string; userId?: number; username?: string };
  index: number;
  onReply: (data: { id: number; username: string }) => void;
  onDelete: (id: number) => void;
  onReport: (data: { type: string; id: number }) => void;
  currentUser: User | null;
  isDeleting: boolean;
  depth?: number;
}

const CommentItem = ({ comment, index, onReply, onDelete, onReport, currentUser, isDeleting, depth = 0 }: CommentItemProps) => {
  const navigate = useNavigate();
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2.5, 
          borderRadius: '12px', 
          border: '1px solid rgba(0,0,0,0.03)', 
          ml: depth > 0 ? 4 : 0, 
          bgcolor: depth > 0 ? 'rgba(0,0,0,0.02)' : 'white',
          position: 'relative',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.01)' }
        }}
      >
        {depth > 0 && (
          <Box sx={{ position: 'absolute', left: -20, top: 0, bottom: 20, width: '1px', bgcolor: 'divider' }} />
        )}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar 
            src={comment.userProfilePictureUrl} 
            sx={{ width: 40, height: 40, border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer' }} 
            onClick={() => navigate(`/profile/${comment.userId}`)} 
          />
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer' }} onClick={() => navigate(`/profile/${comment.userId}`)}>
                {comment.username}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {new Date(comment.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, mb: 1, fontSize: '0.95rem', fontWeight: 500 }}>
              {comment.content}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button 
                size="small" 
                startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: '16px !important' }} />}
                sx={{ p: 0, minWidth: 0, color: 'primary.main', fontWeight: 800, textTransform: 'none', '&:hover': { opacity: 0.8 } }} 
                onClick={() => onReply({ id: comment.id, username: comment.username || comment.author.username })}
              >
                Reply
              </Button>
              {currentUser && (currentUser.username === comment.username || 
                currentUser.roles?.some((r: string) => r === 'ROLE_ADMIN')) && (
                <Button 
                  size="small" 
                  startIcon={isDeleting ? <CircularProgress size={12} /> : <DeleteOutlineIcon sx={{ fontSize: '16px !important' }} />}
                  sx={{ p: 0, minWidth: 0, color: 'error.main', fontWeight: 800, textTransform: 'none', '&:hover': { opacity: 0.8 } }}
                  onClick={() => onDelete(comment.id)}
                  disabled={isDeleting}
                >
                  Delete
                </Button>
              )}
              {currentUser && currentUser.username !== comment.username && (
                <Button 
                  size="small" 
                  startIcon={<FlagIcon sx={{ fontSize: '16px !important' }} />}
                  sx={{ p: 0, minWidth: 0, color: 'text.secondary', fontWeight: 800, textTransform: 'none', '&:hover': { color: 'error.main' } }}
                  onClick={() => onReport({ type: 'COMMENT', id: comment.id })}
                >
                  Report
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Paper>
      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
          {comment.replies.map((reply: Comment, rIdx: number) => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              index={rIdx} 
              onReply={onReply} 
              onDelete={onDelete} 
              onReport={onReport}
              currentUser={currentUser}
              isDeleting={isDeleting} // simplification: only one deleting at a time
              depth={depth + 1}
            />
          ))}
        </Box>
      )}
    </motion.div>
  );
};

const RecipeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { subscribeToRecipe, recipeStats, viewerCounts } = useWebSocket();
  
  const recipeId = parseInt(id || '0');
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: number; username: string } | null>(null);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [reportData, setReportData] = useState<{ type: string; id: number } | null>(null);
  const [reportReason, setReportReason] = useState('');

  // --- Mutations ---
  const upgradeMutation = useMutation({
    mutationFn: () => userService.upgradeToPremium(),
    onSuccess: (res: { url?: string }) => {
      if (res?.url) {
        window.location.href = res.url;
      }
    },
    onError: (error: { response?: { data?: { message?: string; error?: string } } }) => {
      const responseData = error.response?.data;
      const errorMessage = responseData?.message || responseData?.error || (typeof responseData === 'string' ? responseData : 'Stripe Checkout failed. Please try again later.');
      toast.error(errorMessage);
    },
  });

  const likeMutation = useMutation({
    mutationFn: () => recipeService.likeRecipe(recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', recipeId] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (text: string) => recipeService.addComment(recipeId, text, replyingTo?.id),
    onSuccess: () => {
      setCommentText('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['recipes', recipeId, 'comments'] });
      toast.success('Comment posted!');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => recipeService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', recipeId, 'comments'] });
      toast.success('Comment deleted');
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => recipeService.bookmarkRecipe(recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', recipeId] });
      // We will handle the toast message inside the handler to access current recipeDetail safely
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: () => recipeService.deleteRecipe(recipeId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['recipes', recipeId] });
      queryClient.removeQueries({ queryKey: ['recipes', recipeId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Recipe deleted successfully');
      navigate('/feed');
    },
    onError: () => toast.error('Failed to delete recipe'),
  });
  
  const rateMutation = useMutation({
    mutationFn: (rating: number) => recipeService.rateRecipe(recipeId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', recipeId] });
      toast.success('Rating submitted!');
    },
    onError: () => toast.error('Failed to submit rating'),
  });

  const reportMutation = useMutation({
    mutationFn: (data: { targetType: string; targetId: number; reason: string }) => 
      api.post('/reports', data),
    onSuccess: () => {
      toast.success('Report submitted. Thank you!');
      setReportData(null);
      setReportReason('');
    },
    onError: () => toast.error('Failed to submit report'),
  });

  // --- Real-Time Subscription ---
  useEffect(() => {
    if (recipeId) {
      const unsubscribe = subscribeToRecipe(recipeId);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [recipeId, subscribeToRecipe]);

  // --- Data Fetching (UseQuery) ---
  const { 
    data: recipeDetail, 
    isLoading: isRecipeLoading, 
    error: recipeError 
  } = useQuery({
    queryKey: ['recipes', recipeId],
    queryFn: () => recipeService.getRecipeById(recipeId),
    enabled: !!recipeId && !isNaN(recipeId),
  });

  const { 
    data: comments = [] 
  } = useQuery({
    queryKey: ['recipes', recipeId, 'comments'],
    queryFn: () => recipeService.getComments(recipeId).then(res => res.content),
    enabled: !!recipeId && !isNaN(recipeId) && !!recipeDetail,
  });

  // Use real-time stats if available, otherwise fallback to initial query data
  const liveStats = recipeStats[recipeId];
  const currentLikeCount = liveStats ? liveStats.likeCount : (recipeDetail?.likeCount || 0);
  const currentCommentCount = liveStats ? liveStats.commentCount : (recipeDetail?.commentCount || 0);
  const currentViewers = viewerCounts[recipeId] || 0;

  // --- Handlers ---
  const handleLike = () => {
    if (!currentUser) return navigate('/login');
    likeMutation.mutate();
  };
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return navigate('/login');
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('Delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleBookmark = () => {
    if (!currentUser) return navigate('/login');
    const isBookmarked = recipeDetail?.isBookmarked;
    bookmarkMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
      }
    });
  };

  const handleDeleteRecipe = () => {
    if (window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      deleteRecipeMutation.mutate();
    }
  };

  const handleReportSubmit = () => {
    if (!reportReason.trim() || !reportData) return;
    reportMutation.mutate({
      targetType: reportData.type,
      targetId: reportData.id,
      reason: reportReason
    });
  };

  // Image logic
  const displayImage = activeImage || recipeDetail?.imageUrl;

  const premium = Boolean((currentUser as User | null)?.premium);
  
  // DIAGNOSTIC LOG: Help verify premium status sync
  useEffect(() => {
    if (recipeDetail?.isPremium) {
      console.log(`[RecipeDetailPage] Recipe "${recipeDetail.id}" is PREMIUM. User "${currentUser?.username}" premium status: ${premium}`);
    }
  }, [recipeDetail, currentUser?.username, premium]);

  if (isRecipeLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }} data-testid="recipe-loading">
        <CircularProgress />
      </Box>
    );
  }

  const recipeErrorCode = (recipeError as { response?: { status?: number } })?.response?.status;
  if (recipeErrorCode === 402 || recipeErrorCode === 403) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', py: 12 }}>
        <Container maxWidth="sm">
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '32px', border: '1px solid rgba(0,0,0,0.05)' }}>
            <WorkspacePremiumIcon sx={{ fontSize: 80, color: '#FFD700', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>Premium Experience</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, fontWeight: 500 }}>
              This culinary masterpiece is reserved for our Premium chefs. Upgrade your account to unlock full access to ingredients, instructions, and community secrets.
            </Typography>
            <Stack spacing={2}>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => upgradeMutation.mutate()}
                disabled={upgradeMutation.isPending}
                sx={{ 
                  py: 2.5, 
                  borderRadius: '20px', 
                  fontWeight: 950, 
                  fontSize: '1.2rem', 
                  bgcolor: '#FFD700', 
                  color: 'black',
                  boxShadow: '0 12px 24px rgba(234, 179, 8, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: '#EAB308',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 16px 32px rgba(234, 179, 8, 0.4)'
                  } 
                }}
              >
                {upgradeMutation.isPending ? 'Connecting to Stripe...' : '💳 Unlock All for ₹499 (One-time)'}
              </Button>
              <Button 
                variant="text" 
                onClick={() => navigate('/feed')}
                sx={{ fontWeight: 800, color: 'text.secondary' }}
              >
                Continue Free Exploration
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (recipeError || !recipeDetail) {
    return (
      <Box className="bg-mesh" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 12 }}>
        <Container maxWidth="sm">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Paper elevation={0} className="glass-card" sx={{ p: 6, textAlign: 'center', borderRadius: '32px' }}>
              <Typography variant="h2" sx={{ fontWeight: 950, mb: 2, color: 'primary.main' }}>404</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Recipe Not Found</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, fontWeight: 500 }}>
                The culinary masterpiece you're looking for might have been removed or moved to a different kitchen.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<ArrowBackIcon />} 
                onClick={() => navigate('/feed')}
                sx={{ py: 1.5, px: 4, borderRadius: '12px', fontWeight: 900 }}
              >
                Back to Discovery
              </Button>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    );
  }

  return (
    <Box className="bg-mesh" sx={{ minHeight: '100vh', py: { xs: 4, md: 10 } }}>
      <Container maxWidth="lg">
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)} 
          sx={{ 
            mb: 2, 
            borderRadius: '8px', 
            fontWeight: 800, 
            color: 'text.secondary',
            textTransform: 'none',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.03)', color: 'primary.main' }
          }}
        >
          Back to discovery
        </Button>
        
        <Grid container spacing={6}>
          {/* Left Column: Image and Main Info */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ position: 'relative', mb: 6 }}>
              {displayImage ? (
                <Box 
                  component="img" 
                  src={displayImage} 
                  sx={{ 
                    width: '100%', 
                    aspectRatio: '16/9',
                    objectFit: 'cover',
                    borderRadius: '16px', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    transition: 'all 0.5s ease-in-out'
                  }}
                  onError={(e) => {
                    console.warn("Failed to load recipe image:", displayImage);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.classList.add('no-image-fallback');
                  }}
                />
              ) : (
                <Box 
                  sx={{ 
                    width: '100%', 
                    aspectRatio: '16/9',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <RestaurantIcon sx={{ fontSize: 80, color: 'primary.light', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    No Image Provided
                  </Typography>
                </Box>
              )}
              
              {/* Additional Images Thumbnails */}
              {recipeDetail.additionalImages && recipeDetail.additionalImages.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2, overflowX: 'auto', pb: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                  <Box 
                    onClick={() => setActiveImage(recipeDetail.imageUrl)}
                    sx={{ 
                      width: 80, height: 80, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                      border: activeImage === recipeDetail.imageUrl ? '3px solid #6366f1' : '1px solid rgba(0,0,0,0.1)',
                      opacity: activeImage === recipeDetail.imageUrl ? 1 : 0.6,
                      transition: 'all 0.2s'
                    }}
                  >
                    <img src={recipeDetail.imageUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                  {recipeDetail.additionalImages.map((img, idx) => (
                    <Box 
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      sx={{ 
                        width: 80, height: 80, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                        border: activeImage === img ? '3px solid #6366f1' : '1px solid rgba(0,0,0,0.1)',
                        opacity: activeImage === img ? 1 : 0.6,
                        transition: 'all 0.2s'
                      }}
                    >
                      <img src={img} alt={`Additional ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  ))}
                </Box>
              )}

              <Box 
                sx={{ 
                  position: 'absolute', top: 24, right: 24,
                  display: 'flex', gap: 2
                }}
              >
                <IconButton 
                  size="large"
                  onClick={() => setReportData({ type: 'RECIPE', id: recipeId })}
                  sx={{ 
                    bgcolor: 'white',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'white', color: 'error.main', transform: 'translateY(-2px)' } 
                  }}
                >
                  <FlagIcon />
                </IconButton>
                {currentUser && !premium && (
                  <IconButton 
                    size="large"
                    onClick={handleBookmark}
                    disabled={bookmarkMutation.isPending}
                    sx={{ 
                      bgcolor: 'white',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                      color: recipeDetail?.isBookmarked ? 'primary.main' : 'inherit',
                      '&:hover': { bgcolor: 'white', transform: 'translateY(-2px)' } 
                    }}
                  >
                    {recipeDetail?.isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
              <Typography variant="h1" sx={{ fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1, fontSize: { xs: '2.5rem', md: '4.5rem' } }}>
                {recipeDetail.title}
              </Typography>
              
              {currentViewers > 0 && (
                <Box 
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  sx={{ 
                    display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.8, 
                    borderRadius: '50px', bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <Box sx={{ 
                    width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444',
                    animation: 'pulse 1.5s infinite' 
                  }} />
                  <Typography sx={{ color: '#ef4444', fontWeight: 900, fontSize: '0.85rem' }}>
                    {currentViewers} {currentViewers === 1 ? 'person' : 'people'} viewing now
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating 
                  value={recipeDetail.averageRating || 0} 
                  precision={0.5} 
                  readOnly 
                  sx={{ color: 'primary.main' }}
                />
                <Typography sx={{ fontWeight: 900, color: 'text.primary', fontSize: '1.1rem' }}>
                  {recipeDetail.averageRating?.toFixed(1) || '0.0'}
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>
                ({recipeDetail.ratingCount || 0} reviews)
              </Typography>
            </Box>
            <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
              {currentUser && recipeDetail.author.username === (currentUser as User).username && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  size="small"
                  onClick={() => navigate(`/recipes/${recipeDetail.id}/edit`)}
                  sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800 }}
                >
                  Edit Recipe
                </Button>
              )}
              {currentUser && ((currentUser as User).username === recipeDetail.author.username || 
                (currentUser as User).roles?.some((r: string) => r === 'ROLE_ADMIN')) && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  size="small"
                  onClick={handleDeleteRecipe}
                  disabled={deleteRecipeMutation.isPending}
                  sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800 }}
                >
                  Delete Recipe
                </Button>
              )}
            </Box>
            
            <Box 
              className="glass-card"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 6, 
                p: 2, 
                borderRadius: '12px',
              }}
            >
              <Avatar 
                src={recipeDetail.author.profilePictureUrl} 
                sx={{ width: 64, height: 64, cursor: 'pointer', mr: 2.5, border: '3px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                onClick={() => navigate(`/profile/${recipeDetail.author.id}`)}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { color: 'primary.main' } }} onClick={() => navigate(`/profile/${recipeDetail.author.id}`)}>
                  {recipeDetail.author.username}
                  {recipeDetail.author.isVerified && <VerifiedIcon sx={{ fontSize: 18, color: 'primary.main' }} />}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Master Chef • {new Date(recipeDetail.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1 }} />
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 1.5, 
                  px: 2, 
                  borderRadius: '8px', 
                  bgcolor: recipeDetail.isLiked ? '#fff1f2' : '#f8fafc',
                  transition: 'all 0.3s ease'
                }}
              >
                <IconButton 
                  onClick={handleLike} 
                  sx={{ 
                    color: recipeDetail.isLiked ? 'secondary.main' : 'text.disabled',
                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': { transform: 'scale(1.2)' }
                  }}
                >
                  {recipeDetail.isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
                <Typography sx={{ fontWeight: 900, color: recipeDetail.isLiked ? 'secondary.main' : 'text.primary', ml: 1 }}>
                  {currentLikeCount}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 8 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 2, letterSpacing: '-0.02em' }}>
                <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'primary.light', display: 'flex' }}>
                  <DescriptionIcon sx={{ color: 'primary.main' }} />
                </Box>
                Culinary Story
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 2, fontSize: '1.2rem', fontWeight: 500, letterSpacing: '0.01em' }}>
                {recipeDetail.description}
              </Typography>
            </Box>

            {/* Rating Interaction */}
            <Paper 
              className="glass-card" 
              sx={{ 
                p: 4, 
                borderRadius: '24px', 
                mb: 8, 
                bgcolor: 'rgba(99, 102, 241, 0.03)',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                textAlign: 'center'
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>How was it?</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, fontWeight: 600 }}>
                {recipeDetail.userRating ? "You've rated this recipe" : "Give this recipe a star rating"}
              </Typography>
              <Rating 
                size="large"
                value={recipeDetail.userRating || 0}
                onChange={(_, newValue) => {
                  if (!currentUser) return navigate('/login');
                  if (newValue) rateMutation.mutate(newValue);
                }}
                disabled={rateMutation.isPending}
                sx={{ 
                  fontSize: '3rem',
                  '& .MuiRating-iconFilled': { color: 'primary.main' },
                  '& .MuiRating-iconHover': { color: 'primary.main' }
                }}
              />
            </Paper>

            {recipeDetail.content && (
              <Box sx={{ mb: 8 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, display: 'flex', alignItems: 'center', gap: 2, letterSpacing: '-0.02em' }}>
                  <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'secondary.light', display: 'flex' }}>
                    <RestaurantIcon sx={{ color: 'secondary.main' }} />
                  </Box>
                  Kitchen Secrets & Tips
                </Typography>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 4, 
                    borderRadius: '24px', 
                    bgcolor: 'white',
                    border: '1px solid rgba(0,0,0,0.05)',
                    lineHeight: 1.8,
                    fontSize: '1.1rem',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {recipeDetail.content}
                </Paper>
              </Box>
            )}

            {/* Social Section */}
            <Box id="comments" sx={{ mt: 10 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: '-0.03em' }}>
                  Community Talk <span style={{ color: '#6366f1', fontSize: '1.5rem', opacity: 0.7 }}>({currentCommentCount})</span>
                </Typography>
              </Box>

              <Paper className="glass" sx={{ p: 3, borderRadius: '12px', mb: 4 }}>
                <Box component="form" onSubmit={handleCommentSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {replyingTo && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#eef2ff', p: 1.5, borderRadius: '10px' }}>
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800 }}>Replying to <b>@{replyingTo.username}</b></Typography>
                      <Button size="small" variant="text" color="primary" sx={{ p: 0, minWidth: 0, fontWeight: 800 }} onClick={() => setReplyingTo(null)}>Cancel</Button>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', gap: 2.5 }}>
                    <Avatar 
                      src={(currentUser as User | null)?.profilePictureUrl} 
                      sx={{ width: 48, height: 48, border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    />
                    <TextField 
                      fullWidth 
                      multiline
                      rows={currentUser ? 3 : 1}
                      placeholder={currentUser ? "Share your thoughts on this culinary masterpiece..." : "Sign in to share your thoughts..."} 
                      variant="outlined"
                      value={commentText} 
                      onChange={(e) => setCommentText(e.target.value)}
                      onClick={() => { if (!currentUser) navigate('/login'); }}
                      disabled={addCommentMutation.isPending}
                      sx={{
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: '8px', 
                          bgcolor: 'white',
                          fontWeight: 500,
                          '& fieldset': { borderColor: 'rgba(0,0,0,0.05)' },
                          '&:hover fieldset': { borderColor: 'primary.light' }
                        }
                      }}
                    />
                  </Box>
                  {currentUser && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        endIcon={addCommentMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />} 
                        disabled={!commentText.trim() || addCommentMutation.isPending}
                        sx={{ 
                          borderRadius: '14px', 
                          px: 5, 
                          py: 1.5, 
                          fontWeight: 900,
                          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)'
                        }}
                      >
                        {addCommentMutation.isPending ? 'Posting...' : 'Post Thought'}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Paper>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {comments.map((comment: Comment & { userProfilePictureUrl?: string; userId?: number; username?: string }, index: number) => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    index={index}
                    onReply={setReplyingTo}
                    onDelete={handleDeleteComment}
                    onReport={(data: { type: string; id: number }) => setReportData(data)}
                    currentUser={currentUser}
                    isDeleting={deleteCommentMutation.isPending && deleteCommentMutation.variables === comment.id}
                  />
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Right Column: Cooking Stats & Ingredients */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ position: 'sticky', top: 120 }}>
              <Paper 
                className="glass-card"
                sx={{ p: 3, borderRadius: '16px', mb: 3 }}
              >
                {recipeDetail.calories && (
                  <Paper 
                    className="glass-card"
                    sx={{ p: 3, borderRadius: '16px', mb: 3 }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 3, letterSpacing: '-0.02em' }}>Nutritional Overview</Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: 'Calories', value: `${recipeDetail.calories} kcal`, color: '#6366f1' },
                        { label: 'Protein', value: `${recipeDetail.protein}g`, color: '#10b981' },
                        { label: 'Carbs', value: `${recipeDetail.carbs}g`, color: '#f59e0b' },
                        { label: 'Fats', value: `${recipeDetail.fats}g`, color: '#f43f5e' }
                      ].map((macro) => (
                        <Grid size={{ xs: 3 }} key={macro.label}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, display: 'block', mb: 0.5, fontSize: '0.65rem' }}>{macro.label.toUpperCase()}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 950, color: macro.color }}>{macro.value}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                )}

                <Typography variant="h6" sx={{ fontWeight: 900, mb: 4, letterSpacing: '-0.02em' }}>Kitchen Briefing</Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 3, borderRadius: '20px', bgcolor: '#f5f7ff', border: '1px solid #e2e8f0' }}>
                      <AccessTimeIcon sx={{ color: 'primary.main', mb: 1.5, fontSize: 28 }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, display: 'block', mb: 0.5, letterSpacing: '0.05em' }}>DURATION</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        {Number(recipeDetail.prepTimeMinutes) + Number(recipeDetail.cookTimeMinutes)} min
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ p: 3, borderRadius: '20px', bgcolor: '#fff5f5', border: '1px solid #fee2e2' }}>
                      <RestaurantIcon sx={{ color: 'secondary.main', mb: 1.5, fontSize: 28 }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, display: 'block', mb: 0.5, letterSpacing: '0.05em' }}>PORTIONS</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 950 }}>{recipeDetail.servings} people</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              <Paper 
                className="glass-card"
                sx={{ p: 3, borderRadius: '16px', mb: 4 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 8, height: 24, borderRadius: 4, bgcolor: 'primary.main' }} />
                  Inventory Needed
                </Typography>

                <Stack spacing={2} sx={{ mb: 4 }}>

                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<CalendarMonthIcon />}
                    onClick={() => setIsPlannerOpen(true)}
                    sx={{ borderRadius: '8px', py: 1, fontWeight: 900 }}
                  >
                    Add to Meal Planner
                  </Button>
                </Stack>

                <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recipeDetail.ingredients.map((ing) => (
                    <ListItem key={ing.id} sx={{ px: 0, py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main', boxShadow: '0 0 0 5px rgba(99, 102, 241, 0.1)' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>{ing.name}</Typography>
                            <Typography sx={{ color: 'primary.main', fontWeight: 950, bgcolor: '#eef2ff', px: 1.5, py: 0.5, borderRadius: '10px', fontSize: '0.9rem' }}>
                              {ing.quantity} {ing.unit || ''}
                            </Typography>
                          </Box>
                        } 
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>

              <Typography variant="h5" sx={{ fontWeight: 950, mb: 4, px: 2, letterSpacing: '-0.02em' }}>The Process</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                {[...recipeDetail.steps].sort((a, b) => Number(a.stepNumber) - Number(b.stepNumber)).map((step, index) => (
                  <Box 
                    key={step.id} 
                    sx={{ 
                      display: 'flex', 
                      gap: 3, 
                      p: 4, 
                      borderRadius: '24px', 
                      bgcolor: 'white', 
                      border: '1px solid rgba(0,0,0,0.03)', 
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
                      '&:hover': { 
                        transform: 'scale(1.05) translateX(10px)', 
                        borderColor: 'primary.light',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
                      } 
                    }}
                  >
                    <Box sx={{ 
                      minWidth: 36, height: 36, borderRadius: '8px', 
                      bgcolor: 'primary.main', color: 'white', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 950, fontSize: '1.1rem', boxShadow: '0 4px 8px rgba(99, 102, 241, 0.2)'
                    }}>
                      {index + 1}
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.8, color: 'text.primary', fontSize: '1.05rem' }}>
                      {step.instruction}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
      
      {recipeDetail && (
        <AddToPlannerModal 
          open={isPlannerOpen} 
          onClose={() => setIsPlannerOpen(false)}
          recipeId={recipeDetail.id}
          recipeTitle={recipeDetail.title}
        />
      )}

      {/* Report Dialog */}
      <Dialog open={!!reportData} onClose={() => setReportData(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Report Content</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
            Help us understand what's wrong with this {reportData?.type.toLowerCase()}.
          </Typography>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            placeholder="Reason for reporting..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setReportData(null)} sx={{ fontWeight: 800 }}>Cancel</Button>
          <Button 
            onClick={handleReportSubmit} 
            variant="contained" 
            color="error" 
            disabled={!reportReason.trim() || reportMutation.isPending}
            sx={{ borderRadius: '10px', fontWeight: 900, px: 3 }}
          >
            {reportMutation.isPending ? 'Reporting...' : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecipeDetailPage;

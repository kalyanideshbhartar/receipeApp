import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, Box, Typography, Avatar, 
  Button, Paper, Tabs, Tab, CircularProgress, 
  Alert, Grid, Drawer, IconButton, Tooltip, Chip
} from '@mui/material';
import CommunitySidebar from '../../components/home/CommunitySidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EditIcon from '@mui/icons-material/Edit';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import VerifiedIcon from '@mui/icons-material/Verified';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HubIcon from '@mui/icons-material/Hub';
import PeopleIcon from '@mui/icons-material/People';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldIcon from '@mui/icons-material/Shield';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { recipeService, type RecipeSummary } from '../../services/recipe.service';
import RecipeCard from '../../components/recipes/RecipeCard';
import EditProfileModal from '../../components/profile/EditProfileModal';
import { userService, type UserProfile } from '../../services/user.service';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import UserListModal from '../../components/profile/UserListModal';
import { useDispatch } from 'react-redux';
import { useRef } from 'react';
import { upgradeSuccess, updateUser } from '../../features/auth/authSlice';

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState(0);
  const dispatch = useDispatch();
  const hasHandledUpgrade = useRef(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPulseDrawerOpen, setIsPulseDrawerOpen] = useState(false);
  const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);
  const [userListTitle, setUserListTitle] = useState('');
  const [modalUsers, setModalUsers] = useState<UserProfile[]>([]);
  const [isUserListLoading, setIsUserListLoading] = useState(false);
  
  // Handle Stripe redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const upgrade = params.get('upgrade');
    const sessionId = params.get('session_id');
    
    if (hasHandledUpgrade.current) return;

    if (upgrade === 'success') {
      hasHandledUpgrade.current = true;
      if (sessionId) {
        userService.verifyPremiumSession(sessionId).then(() => {
          // Refresh full user data to sync premium status
          userService.getCurrentUser().then((freshUser) => {
            dispatch(updateUser(freshUser));
            toast.success('Congratulations! Your account is now synced. 💎', { id: 'upgrade-success' });
          });
          queryClient.invalidateQueries({ queryKey: ['profiles', id] });
        }).catch(() => {
          toast.error('Could not verify your premium session. Please contact support.', { id: 'upgrade-error' });
        });
      } else {
        dispatch(upgradeSuccess());
        toast.success('Congratulations! You are now a Premium Member. 💎', { id: 'upgrade-success' });
        queryClient.invalidateQueries({ queryKey: ['profiles', id] });
      }
      window.history.replaceState({}, '', window.location.pathname);
    } else if (upgrade === 'cancel') {
      hasHandledUpgrade.current = true;
      toast.error('Upgrade cancelled. No worries, you can try again later!', { id: 'upgrade-cancel' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [id, queryClient, dispatch]);

  // --- Data Fetching (React Query) ---
  const { 
    data: profile, 
    isLoading: isProfileLoading, 
    error: profileError 
  } = useQuery({
    queryKey: ['profiles', id],
    queryFn: () => userService.getProfile(Number(id)),
    enabled: !!id,
  });

  const isOwnProfile = currentUser?.username === profile?.username;
  const isAdmin = profile?.roles?.includes('ROLE_ADMIN') || false;
  const [additionalRecipes, setAdditionalRecipes] = useState<RecipeSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const { 
    data: recipesData,
    isLoading: isRecipesLoading,
    isFetching: isRecipesFetching
  } = useQuery({
    queryKey: ['recipes', 'profile', id, activeTab],
    queryFn: async () => {
      const data = activeTab === 0 
        ? await recipeService.getUserRecipes(Number(id)) 
        : await recipeService.getUserLikedRecipes(Number(id));
      return data;
    },
    enabled: !!id && !!profile && !isAdmin,
  });

  const {
    data: adminStats = { totalUsers: 0 },
    isLoading: isAdminStatsLoading
  } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<{ totalUsers: number }>('/admin/stats').then(res => ({
      totalUsers: res.data.totalUsers || 0,
    })),
    enabled: !!id && !!profile && isAdmin && isOwnProfile,
  });

  // Sync nextCursor and reset additional pages when primary query data changes
  useEffect(() => {
    setAdditionalRecipes([]);
    setNextCursor(recipesData?.nextCursor ?? null);
  }, [recipesData]);

  // Derive final recipes list: query data + any load-more pages
  const recipes = [...(recipesData?.content ?? []), ...additionalRecipes];

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    const data = activeTab === 0 
      ? await recipeService.getUserRecipes(Number(id!), nextCursor) 
      : await recipeService.getUserLikedRecipes(Number(id!), nextCursor);
    setAdditionalRecipes(prev => [...prev, ...data.content]);
    setNextCursor(data.nextCursor);
  };

  // --- Mutations ---
  const followMutation = useMutation({
    mutationFn: () => profile?.isFollowing 
      ? userService.unfollowUser(Number(id)) 
      : userService.followUser(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles', id] });
    },
  });

  const handleFollowToggle = () => followMutation.mutate();

  const likeMutation = useMutation({
    mutationFn: (id: number) => recipeService.likeRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles', id, 'recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: () => toast.error('Failed to update like'),
  });

  const bookmarkMutation = useMutation({
    mutationFn: (id: number) => recipeService.bookmarkRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles', id, 'recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: () => toast.error('Failed to update bookmark'),
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

  const handleShowFollowers = async () => {
    if (!profile) return;
    setUserListTitle('Followers');
    setIsUserListModalOpen(true);
    setIsUserListLoading(true);
    try {
      const data = await userService.getFollowers(Number(id));
      setModalUsers(data);
    } catch {
      toast.error('Failed to load followers');
    } finally {
      setIsUserListLoading(false);
    }
  };

  const handleShowFollowing = async () => {
    if (!profile) return;
    setUserListTitle('Following');
    setIsUserListModalOpen(true);
    setIsUserListLoading(true);
    try {
      const data = await userService.getFollowing(Number(id));
      setModalUsers(data);
    } catch {
      toast.error('Failed to load following');
    } finally {
      setIsUserListLoading(false);
    }
  };

  if (isProfileLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }} data-testid="profile-loading">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (profileError || !profile) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">{(profileError as Error)?.message || 'User not found'}</Alert>
      </Container>
    );
  }

  return (
    <Box className="bg-mesh" sx={{ minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Paper 
          className="glass-card"
          sx={{ 
            p: 0, 
            borderRadius: 3, 
            mb: 6, 
            position: 'relative', 
            overflow: 'hidden',
          }}
        >
          {/* Cover Photo Area with Parallax Effect Placeholder */}
          <Box sx={{ position: 'relative', height: { xs: 240, md: 380 }, overflow: 'hidden' }}>
            {profile.coverPictureUrl ? (
              <Box 
                component="img" 
                src={profile.coverPictureUrl} 
                sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { transform: 'scale(1.08)' } }} 
              />
            ) : (
              <Box sx={{ 
                width: '100%', 
                height: '100%', 
                background: isAdmin 
                  ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' 
                  : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                opacity: 0.95,
                position: 'relative',
                '&::after': isAdmin ? {
                  content: '""',
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
                  pointerEvents: 'none'
                } : {}
              }} />
            )}
            <Box className="card-overlay" />
          </Box>
          
          <Box sx={{ 
            px: { xs: 3, md: 6 }, 
            pb: { xs: 4, md: 6 },
            mt: { xs: -8, md: -12 },
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'flex-end' },
            gap: { xs: 4, md: 6 }
          }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar 
                src={profile.profilePictureUrl} 
                sx={{ 
                  width: { xs: 140, md: 180 }, 
                  height: { xs: 140, md: 180 }, 
                  border: '6px solid white', 
                  boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                  fontSize: '4rem',
                  fontWeight: 950,
                  bgcolor: isAdmin ? '#0f172a' : 'primary.main',
                  color: 'white'
                }}
              >
                {(profile.fullName?.[0] || profile.username?.[0] || '?').toUpperCase()}
              </Avatar>
              {profile.isVerified && (
                <Box 
                  sx={{ 
                    position: 'absolute', bottom: 25, right: 15, 
                    width: 44, height: 44, 
                    bgcolor: 'white', 
                    borderRadius: '50%', 
                    border: '5px solid white', 
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                  }}
                >
                  <VerifiedIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                </Box>
              )}
            </Box>
            
            <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 3, mb: 3 }}>
                <Box>
                  <Typography variant="h2" sx={{ fontWeight: 950, letterSpacing: '-0.04em', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1.5, fontSize: isAdmin ? { xs: '2.5rem', md: '3.5rem' } : undefined }}>
                    {profile.fullName || profile.username}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 700, mt: -0.5, mb: 1 }}>
                    @{profile.username}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: isAdmin ? 'text.primary' : 'primary.main', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isAdmin ? (
                      <Chip 
                        label="Platform Administrator" 
                        size="small" 
                        icon={<AdminPanelSettingsIcon sx={{ fontSize: '14px !important' }} />}
                        sx={{ fontWeight: 900, bgcolor: '#1e293b', color: 'white', '& .MuiChip-icon': { color: 'white' } }} 
                      />
                    ) : (
                      <>{profile.reputationLevel || 'Executive Chef'} • {profile.reputationPoints || 1250} Rep</>
                    )}
                    {!isAdmin && profile.premium && (
                      <Chip 
                        label="Premium Member" 
                        size="small" 
                        icon={<WorkspacePremiumIcon sx={{ fontSize: '14px !important', color: '#FFD700 !important' }} />}
                        sx={{ 
                          ml: 1, 
                          height: 20, 
                          fontSize: '0.65rem', 
                          fontWeight: 900, 
                          bgcolor: 'rgba(255, 215, 0, 0.15)', 
                          color: '#B8860B',
                          border: '1px solid #FFD700',
                          '& .MuiChip-icon': { color: '#FFD700' }
                        }} 
                      />
                    )}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {isOwnProfile ? (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {isAdmin && (
                        <Button 
                          variant="contained" 
                          startIcon={<AdminPanelSettingsIcon />}
                          onClick={() => navigate('/admin')}
                          sx={{ 
                            borderRadius: 2, 
                            px: 3, 
                            py: 1,
                            bgcolor: '#0f172a',
                            color: 'white', 
                            fontWeight: 900,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#1e293b', transform: 'translateY(-2px)' }, 
                            transition: 'all 0.3s ease',
                            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.2)' 
                          }}
                        >
                          Control Dashboard
                        </Button>
                      )}
                      <Button 
                        variant="outlined" 
                        startIcon={<EditIcon />}
                        onClick={() => setIsEditModalOpen(true)}
                        sx={{ 
                          borderRadius: 2, 
                          px: 3, 
                          py: 1,
                          color: 'text.primary', 
                          fontWeight: 800,
                          textTransform: 'none',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }, 
                          boxShadow: 'none' 
                        }}
                      >
                        Edit Profile
                      </Button>
                    </Box>
                  ) : (
                    <Button 
                      variant={profile.isFollowing ? "outlined" : "contained"} 
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending}
                      sx={{ 
                        px: 4, 
                        py: 1,
                        borderRadius: 2, 
                        fontWeight: 900, 
                        minWidth: 120,
                        textTransform: 'none',
                        boxShadow: (profile.isFollowing || followMutation.isPending) ? 'none' : '0 8px 16px rgba(99, 102, 241, 0.2)'
                      }}
                    >
                      {followMutation.isPending ? 'Processing...' : (profile.isFollowing ? 'Following' : 'Follow')}
                    </Button>
                  )}
                  {!isAdmin && (
                    <Tooltip title="Community Pulse">
                      <IconButton 
                        onClick={() => setIsPulseDrawerOpen(true)}
                        sx={{ 
                          bgcolor: 'background.paper', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          border: '1px solid rgba(0,0,0,0.05)',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                        }}
                      >
                        <HubIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500, mb: 4, maxWidth: 650, mx: { xs: 'auto', md: 0 }, fontSize: '1.25rem', lineHeight: 1.6, letterSpacing: '0.01em' }}>
                {profile.bio || (isAdmin 
                  ? 'Official Administrative Profile for the Culinario Platform.' 
                  : 'Passion for good food and community. Sharing my culinary journey one recipe at a time! 🍳✨')}
              </Typography>
              
              {!isAdmin && (
                <Box sx={{ display: 'flex', gap: { xs: 3, md: 5 }, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Box 
                    sx={{ 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.7 } 
                    }}
                    onClick={handleShowFollowers}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 950 }}>{profile.followerCount}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Followers</Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.7 } 
                    }}
                    onClick={handleShowFollowing}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 950 }}>{profile.followingCount}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Following</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 950 }}>{profile.recipeCount || 0}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recipes</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            {!isAdmin ? (
              <>
                <Box sx={{ mb: 8, display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ p: 0.5, borderRadius: 2.5, display: 'inline-flex', bgcolor: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Tabs 
                      value={activeTab} 
                      onChange={(_, val) => setActiveTab(val)} 
                      sx={{ 
                        minHeight: 0,
                        '& .MuiTabs-indicator': { display: 'none' },
                        '& .MuiTab-root': { 
                          minHeight: 40, 
                          px: { xs: 3, sm: 6 }, 
                          borderRadius: 2, 
                          fontSize: '0.9rem', 
                          fontWeight: 900,
                          color: 'text.secondary',
                          textTransform: 'none',
                          transition: 'all 0.3s ease',
                          '&.Mui-selected': { 
                            color: 'white', 
                            bgcolor: 'primary.main',
                            boxShadow: '0 4px 12px rgba(44, 62, 80, 0.2)' 
                          }
                        }
                      }}
                    >
                      <Tab label="Collection" disableRipple />
                      <Tab label="Liked" disableRipple />
                    </Tabs>
                  </Box>
                </Box>

                {isRecipesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}>
                    <Box sx={{ position: 'relative', display: 'flex' }}>
                      <CircularProgress size={60} thickness={4} sx={{ color: '#eef2ff' }} />
                      <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main', position: 'absolute', left: 0, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
                    </Box>
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: {
                        xs: 'repeat(1, 1fr)',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)'
                      },
                      gap: 4
                    }}
                  >
                    {recipes.length > 0 ? (
                      recipes.map((recipe, index) => (
                        <motion.div 
                          key={recipe.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.6 }}
                          style={{ height: '100%', display: 'flex' }}
                        >
                          <RecipeCard 
                            recipe={recipe} 
                            onLike={handleLike} 
                            onBookmark={handleBookmark}
                            onDelete={handleDeleteRecipe}
                          />
                        </motion.div>
                      ))
                    ) : (
                      <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 20 }}>
                        <Box sx={{ bgcolor: 'rgba(0,0,0,0.03)', p: 4, borderRadius: '50%', display: 'inline-flex', mb: 3 }}>
                          <RestaurantMenuIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                        </Box>
                        <Typography variant="h4" sx={{ color: 'text.primary', fontWeight: 950, mb: 2, letterSpacing: '-0.02em' }}>
                          {activeTab === 0 ? "Empty Culinary Canvas" : "No Treasures Discovered"}
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 6, maxWidth: 450, mx: 'auto', fontSize: '1.1rem', fontWeight: 500 }}>
                          Every great chef starts with a blank slate. Begin your journey by sharing your first masterpiece.
                        </Typography>
                        <Button 
                          variant="contained" 
                          size="medium"
                          onClick={() => navigate('/feed')}
                          sx={{ 
                            borderRadius: 2, 
                            px: 4, 
                            py: 1.5, 
                            fontWeight: 900,
                            boxShadow: '0 8px 16px rgba(44, 62, 80, 0.15)',
                            textTransform: 'none',
                          }}
                        >
                          Discover Inspiration
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                {nextCursor && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8, mb: 4 }}>
                    <Button 
                      variant="outlined" 
                      onClick={handleLoadMore}
                      disabled={isRecipesFetching}
                      sx={{ 
                        borderRadius: '16px', 
                        px: 8, 
                        py: 2, 
                        fontWeight: 950,
                        borderWidth: '2px',
                        borderColor: 'primary.main',
                        letterSpacing: '0.05em',
                        fontSize: '1rem',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        '&:hover': { 
                          borderWidth: '2px',
                          transform: 'scale(1.05) translateY(-5px)',
                          boxShadow: '0 12px 24px rgba(99, 102, 241, 0.15)',
                          bgcolor: '#f5f7ff'
                        }
                      }}
                    >
                      {isRecipesFetching ? 'Culinario Loading...' : 'Explore More Creations'}
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box>
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <Box sx={{ mb: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: '-0.03em', color: 'text.primary', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 40 }} /> Administrative Hub
                      </Typography>
                      <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MonitorHeartIcon sx={{ color: '#10b981', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ color: '#059669', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          System Healthy
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={4}>
                      <Grid size={{ xs: 12, md: 8 }}>
                        <Paper className="glass-card" sx={{ p: 4, borderRadius: 3, mb: 4 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                            <Typography variant="h6" sx={{ fontWeight: 950, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <AnalyticsIcon color="primary" /> Platform Overview
                            </Typography>
                            {isAdminStatsLoading && <CircularProgress size={20} />}
                          </Box>
                          
                          <Grid container spacing={3}>
                            <Grid size={{ xs: 12 }}>
                              <Box sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)', transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)' } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                  <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
                                    <PeopleIcon sx={{ color: 'white' }} />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 950 }}>{adminStats.totalUsers}</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Total Community Members</Typography>
                                  </Box>
                                </Box>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                  Active user base growth is monitored daily for platform integrity.
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>

                        <Paper className="glass-card" sx={{ p: 4, borderRadius: 3 }}>
                          <Typography variant="h6" sx={{ fontWeight: 950, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <ShieldIcon color="primary" /> Platform Governance
                          </Typography>
                          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
                            As a Platform Administrator, you have full oversight of the Culinario ecosystem. 
                            Your tools include user moderation, content verification, and system audit capabilities.
                          </Typography>
                          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: '#1e293b' }}>
                              Administrative Notice
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              All administrative actions are logged for security and transparency. 
                              Please ensure adherence to platform moderation guidelines.
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>

                      <Grid size={{ xs: 12, md: 4 }}>
                        <Paper className="glass-card" sx={{ p: 4, borderRadius: 3, height: '100%', border: '2px solid rgba(99, 102, 241, 0.1)' }}>
                          <Typography variant="h6" sx={{ fontWeight: 950, mb: 4 }}>Management Suite</Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Button
                              variant="contained"
                              onClick={() => navigate('/admin')}
                              fullWidth
                              endIcon={<ArrowForwardIcon />}
                              sx={{ 
                                py: 2, 
                                borderRadius: 2.5, 
                                fontWeight: 900, 
                                bgcolor: '#0f172a', 
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#1e293b', transform: 'translateX(5px)' },
                                transition: 'all 0.3s ease'
                              }}
                            >
                              Control Dashboard
                            </Button>
                            <Typography variant="caption" sx={{ px: 1, color: 'text.secondary', fontWeight: 700 }}>
                              QUICK LINKS
                            </Typography>
                            {[
                              { label: 'Manage Users', path: '/admin?tab=0' },
                              { label: 'Security Audit', path: '/admin?tab=1' },
                            ].map((item) => (
                              <Button
                                key={item.label}
                                variant="outlined"
                                onClick={() => navigate(item.path)}
                                fullWidth
                                sx={{ 
                                  py: 1.5, 
                                  textAlign: 'left', 
                                  justifyContent: 'space-between',
                                  borderRadius: 2, 
                                  fontWeight: 800, 
                                  textTransform: 'none', 
                                  color: 'text.primary',
                                  borderColor: 'rgba(0,0,0,0.1)',
                                  '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(99, 102, 241, 0.05)', transform: 'translateX(5px)' },
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                {item.label} <ArrowForwardIcon sx={{ fontSize: 18, opacity: 0.5 }} />
                              </Button>
                            ))}
                          </Box>

                          <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 900, letterSpacing: '0.1em' }}>
                              CULINARIO ADMIN v1.4.2
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </motion.div>
                </AnimatePresence>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>

      <Drawer
        anchor="right"
        open={isPulseDrawerOpen}
        onClose={() => setIsPulseDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            bgcolor: '#ffffff',
            boxShadow: 'none',
            border: 'none',
          }
        }}
      >
        <Box sx={{ 
          height: '100%', 
          bgcolor: 'background.paper',
          p: 3,
          boxShadow: '-10px 0 30px rgba(0,0,0,0.05)',
          overflowY: 'auto'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 950, mb: 4, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <HubIcon color="primary" /> Community Pulse
          </Typography>
          <CommunitySidebar />
        </Box>
      </Drawer>

      {profile && (
        <EditProfileModal 
          open={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          profile={profile}
        />
      )}

      <UserListModal
        open={isUserListModalOpen}
        onClose={() => setIsUserListModalOpen(false)}
        title={userListTitle}
        users={modalUsers}
        isLoading={isUserListLoading}
      />
    </Box>
  );
};

export default ProfilePage;

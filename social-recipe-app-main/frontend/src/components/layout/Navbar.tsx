import { 
  AppBar, Toolbar, Typography, Button, Avatar, 
  Box, IconButton, Menu, MenuItem, InputBase, 
  styled, Container, Tooltip 
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../features/auth/authSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useModal } from '../../context/ModalContext';
import { Badge } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { userService } from '../../services/user.service';
import { toast } from 'react-hot-toast';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '24px',
  backgroundColor: '#f1f5f9',
  '&:hover': {
    backgroundColor: '#e2e8f0',
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  display: 'flex',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  border: '1px solid transparent',
  '&:focus-within': {
    border: `1px solid ${theme.palette.primary.main}`,
    backgroundColor: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  }
}));

const Navbar = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useWebSocket();
  const { openCreateRecipeModal } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const hideSearchPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const shouldHideSearch = hideSearchPaths.includes(location.pathname);

  const upgradeMutation = useMutation({
    mutationFn: () => userService.upgradeToPremium(),
    onSuccess: (res: { url?: string }) => {
      if (res?.url) {
        window.location.href = res.url;
      }
    },
    onError: (error: { response?: { data?: string | { message?: string; error?: string } } }) => {
      const responseData = error.response?.data;
      const errorMessage = responseData?.message || responseData?.error || (typeof responseData === 'string' ? responseData : 'Stripe Checkout failed. Please try again later.');
      toast.error(errorMessage, { id: 'upgrade-error' });
    },
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    signOut();
    handleClose();
    navigate('/login');
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/feed?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleNotifMenu = (event: React.MouseEvent<HTMLElement>) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <FavoriteIcon sx={{ color: 'error.main', fontSize: 18 }} />;
      case 'COMMENT': return <CommentIcon sx={{ color: 'primary.main', fontSize: 18 }} />;
      case 'FOLLOW': return <PersonAddIcon sx={{ color: 'secondary.main', fontSize: 18 }} />;
      default: return null;
    }
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        background: '#ffffff',
        borderBottom: scrolled ? '1px solid #e2e8f0' : 'none',
        transition: 'all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1)',
        pt: scrolled ? 0 : 1,
        boxShadow: scrolled ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
        color: 'text.primary'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
          <Box 
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mr: 4 }}
            onClick={() => navigate('/feed')}
          >
            <Box 
              sx={{ 
                bgcolor: 'primary.main', 
                p: 1, 
                borderRadius: 2, 
                display: 'flex', 
                mr: 1.5,
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'scale(1.05)' }
              }}
            >
              <RestaurantMenuIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Typography
              variant="h5"
              sx={{ 
                fontWeight: 800, 
                letterSpacing: '-0.04em',
                fontSize: '1.5rem',
                display: { xs: 'none', lg: 'block' },
                color: 'primary.main'
              }}
            >
              Culinario
            </Typography>
          </Box>

          {!shouldHideSearch && (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <Search 
                sx={{ 
                  display: { xs: 'none', md: 'flex' },
                  bgcolor: scrolled ? '#f1f5f9' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: scrolled ? 'none' : '0 4px 12px rgba(0,0,0,0.03)',
                  borderRadius: '18px',
                  px: 1
                }}
              >
                <Box sx={{ px: 2, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                  <SearchIcon sx={{ fontSize: 20 }} />
                </Box>
                <InputBase
                  placeholder="Search recipes, chefs, or ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  sx={{
                    color: 'text.primary',
                    width: '100%',
                    '& .MuiInputBase-input': {
                      py: 1.5,
                      pr: 3,
                      width: { md: '35ch', lg: '55ch' },
                      fontSize: '0.95rem',
                      fontWeight: 500
                    },
                  }}
                />
              </Search>
            </Box>
          )}

          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2.5 } }}>
              <Tooltip title="Meal Planner">
                <IconButton 
                  onClick={() => navigate('/planner')}
                  sx={{ 
                    bgcolor: 'rgba(0,0,0,0.03)', 
                    p: 1.2, 
                    borderRadius: '14px',
                    display: { xs: 'none', md: 'flex' },
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' }
                  }}
                >
                  <CalendarMonthIcon />
                </IconButton>
              </Tooltip>



              {user && !(user as User).premium && (
                <Tooltip title="Upgrade for Premium Recipes">
                  <Button 
                    variant="outlined" 
                    onClick={() => upgradeMutation.mutate()}
                    disabled={upgradeMutation.isPending}
                    sx={{ 
                      px: 2, 
                      py: 0.6,
                      borderRadius: '12px',
                      display: { xs: 'none', lg: 'flex' },
                      textTransform: 'none',
                      fontWeight: 800,
                      color: '#B8860B',
                      borderColor: '#FFD700',
                      bgcolor: 'rgba(255, 215, 0, 0.05)',
                      '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.1)', borderColor: '#DAA520' }
                    }}
                  >
                    {upgradeMutation.isPending ? '💎 Upgrading...' : '💎 Premium @ ₹499'}
                  </Button>
                </Tooltip>
              )}

              {user && !(user as User).roles?.includes('ROLE_ADMIN') && (
                <Tooltip title="Create a Recipe">
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={openCreateRecipeModal}
                    sx={{ 
                      px: 1.8, 
                      py: 0.6,
                      borderRadius: '12px',
                      display: { xs: 'none', sm: 'flex' },
                      border: '1px solid #e2e8f0',
                      textTransform: 'none',
                      fontWeight: 700,
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    Post Recipe
                  </Button>
                </Tooltip>
              )}

              {user && !(user as User).roles?.includes('ROLE_ADMIN') && (
                <>
                  <Tooltip title="Notifications">
                    <IconButton 
                      color="inherit" 
                      onClick={handleNotifMenu}
                      sx={{ 
                        bgcolor: 'rgba(0,0,0,0.03)', 
                        p: 1.2, 
                        borderRadius: '14px',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' }
                      }}
                    >
                      <Badge 
                        badgeContent={unreadCount} 
                        color="primary" 
                        overlap="circular"
                        sx={{ '& .MuiBadge-badge': { fontWeight: 800, border: '2px solid white' } }}
                      >
                        <NotificationsNoneIcon />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  
                  <Menu
                    anchorEl={notifAnchorEl}
                    open={Boolean(notifAnchorEl)}
                    onClose={handleNotifClose}
                    PaperProps={{
                      sx: { 
                        mt: 2.5, 
                        width: 380, 
                        maxHeight: 520,
                        borderRadius: '24px', 
                        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden'
                      }
                    }}
                  >
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 900 }}>Notifications</Typography>
                      {unreadCount > 0 && (
                        <Button 
                          size="small" 
                          onClick={markAllAsRead}
                          sx={{ fontWeight: 800, textTransform: 'none' }}
                        >
                          Mark all as read
                        </Button>
                      )}
                    </Box>
                    <Box sx={{ overflowY: 'auto', maxHeight: 400, px: 1 }}>
                      {notifications.length === 0 ? (
                        <Box sx={{ p: 6, textAlign: 'center' }}>
                          <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, borderRadius: '50%', display: 'inline-flex', mb: 2 }}>
                            <NotificationsNoneIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>No notifications yet</Typography>
                          <Typography variant="body2" color="text.secondary">We'll notify you when someone interacts with your recipes!</Typography>
                        </Box>
                      ) : (
                        notifications.map((notif) => (
                          <MenuItem 
                            key={notif.id} 
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.recipeId) navigate(`/recipes/${notif.recipeId}`);
                              else if (notif.senderUserId) navigate(`/profile/${notif.senderUserId}`);
                              else navigate(`/profile/${notif.senderUsername}`);
                              handleNotifClose();
                            }}
                            sx={{ 
                              py: 2, 
                              px: 2, 
                              borderRadius: '16px',
                              mb: 0.5,
                              gap: 2, 
                              transition: 'all 0.2s ease',
                              bgcolor: notif.read ? '#ffffff' : '#f5f7ff',
                            }}
                          >
                            <Avatar 
                              src={notif.senderProfilePictureUrl} 
                              sx={{ width: 44, height: 44, border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            >
                              {notif.senderUsername[0].toUpperCase()}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.2 }}>
                                {getNotifIcon(notif.type)}
                                <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'primary.main' }}>
                                  {notif.type}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ whiteSpace: 'normal', fontWeight: notif.read ? 500 : 800, color: notif.read ? 'text.secondary' : 'text.primary', lineHeight: 1.4 }}>
                                {notif.message}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))
                      )}
                    </Box>
                  </Menu>
                </>
              )}

              <IconButton 
                onClick={handleMenu} 
                sx={{ 
                  p: 0.8, 
                  bgcolor: scrolled ? 'rgba(0,0,0,0.03)' : 'white',
                  borderRadius: '16px',
                  border: '2px solid transparent', 
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    borderColor: 'primary.light',
                    bgcolor: '#f5f7ff',
                    transform: 'translateY(-2px)'
                  } 
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <Avatar 
                    src={user?.profilePictureUrl}
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      fontWeight: 900, 
                      fontSize: 14,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    {user?.username?.[0]?.toUpperCase()}
                  </Avatar>
                  {user && (user as User).premium && (
                    <Box 
                      sx={{ 
                        position: 'absolute', top: -4, right: -4, 
                        bgcolor: '#FFD700', borderRadius: '50%', width: 16, height: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 1
                      }}
                    >
                      <WorkspacePremiumIcon sx={{ fontSize: 10, color: 'white' }} />
                    </Box>
                  )}
                </Box>
              </IconButton>
              <Menu 
                anchorEl={anchorEl} 
                open={Boolean(anchorEl)} 
                onClose={handleClose}
                PaperProps={{
                  sx: { 
                    mt: 2.5, 
                    minWidth: 220, 
                    borderRadius: '20px', 
                    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                    border: '1px solid #e2e8f0',
                    p: 1
                  }
                }}
              >
                <MenuItem 
                  onClick={() => { navigate(`/profile/${user?.id}`); handleClose(); }}
                  sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700 }}
                >
                  My Profile
                </MenuItem>
                {(user?.roles?.includes('ROLE_ADMIN')) && (
                  <MenuItem 
                    onClick={() => { navigate('/admin'); handleClose(); }}
                    sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700, color: 'primary.main' }}
                  >
                    Admin Dashboard
                  </MenuItem>
                )}
                <MenuItem 
                  onClick={() => { navigate('/settings'); handleClose(); }}
                  sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700 }}
                >
                  Settings
                </MenuItem>
                <Box sx={{ my: 1, height: '1px', bgcolor: 'divider', mx: 2 }} />
                <MenuItem 
                  onClick={handleLogout} 
                  sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700, color: 'secondary.main' }}
                >
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                onClick={() => navigate('/login')}
                sx={{ fontWeight: 800, textTransform: 'none', color: 'text.primary' }}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                onClick={() => navigate('/register')} 
                sx={{ 
                  borderRadius: '12px', 
                  px: 4, 
                  fontWeight: 800, 
                  textTransform: 'none',
                  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
                }}
              >
                Join Now
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;

import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AddBoxIcon from '@mui/icons-material/AddBox';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../context/ModalContext';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { openCreateRecipeModal, isCreateRecipeModalOpen } = useModal();

  if (!isAuthenticated) return null;

  const getActiveValue = () => {
    const path = location.pathname;
    if (path === '/feed') return 0;
    if (path === '/shopping') return 1;
    if (isCreateRecipeModalOpen) return 2;
    if (path === '/planner') return 3;
    if (path.includes(`/profile/${user?.username}`)) return 4;
    return 0;
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        display: { xs: 'block', sm: 'none' },
        zIndex: 1000,
        borderRadius: 0,
        borderTop: '1px solid #e2e8f0',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.03)'
      }} 
      elevation={3}
    >
      <BottomNavigation
        showLabels={false}
        value={getActiveValue()}
        onChange={(_, newValue) => {
          if (newValue === 0) navigate('/feed');
          if (newValue === 1) navigate('/shopping'); 
          if (newValue === 2) openCreateRecipeModal();
          if (newValue === 3) navigate('/planner');
          if (newValue === 4) navigate(`/profile/${user?.username}`);
        }}
        sx={{ height: 64 }}
      >
        <BottomNavigationAction icon={<HomeIcon sx={{ color: 'primary.main' }} />} />
        <BottomNavigationAction icon={<ShoppingBasketIcon sx={{ color: 'primary.main' }} />} />
        <BottomNavigationAction icon={<AddBoxIcon sx={{ fontSize: 32, color: 'secondary.main' }} />} />
        <BottomNavigationAction icon={<CalendarMonthIcon sx={{ color: 'primary.main' }} />} />
        <BottomNavigationAction icon={<PersonIcon sx={{ color: 'primary.main' }} />} />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;

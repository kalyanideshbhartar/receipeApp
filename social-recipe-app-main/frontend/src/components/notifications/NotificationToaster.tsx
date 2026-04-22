import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Box, Card, Typography, Avatar, 
  IconButton 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface Notification {
  id: number;
  senderUsername: string;
  senderProfilePictureUrl: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW';
  recipeId?: number;
  message: string;
  read: boolean;
  createdAt: string;
}

const NotificationToaster = () => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleNewNotification = (event: Event) => {
      const customEvent = event as CustomEvent<Notification>;
      setNotification(customEvent.detail);
      // Auto close after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    };

    window.addEventListener('new_notification', handleNewNotification);
    return () => window.removeEventListener('new_notification', handleNewNotification);
  }, []);

  if (!notification || user?.roles?.includes('ROLE_ADMIN')) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'LIKE': return <FavoriteIcon sx={{ color: 'error.main', fontSize: 20 }} />;
      case 'COMMENT': return <CommentIcon sx={{ color: 'primary.main', fontSize: 20 }} />;
      case 'FOLLOW': return <PersonAddIcon sx={{ color: 'secondary.main', fontSize: 20 }} />;
      default: return null;
    }
  };

  const handleAction = () => {
    if (notification.recipeId) {
      navigate(`/recipes/${notification.recipeId}`);
    } else {
      navigate(`/profile/${notification.senderUsername}`);
    }
    setNotification(null);
  };

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        top: 24, 
        right: 24, 
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{ pointerEvents: 'auto' }}
          >
            <Card
              onClick={handleAction}
              sx={{
                minWidth: 320,
                maxWidth: 400,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                borderRadius: '20px',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.15)',
                }
              }}
            >
              <Avatar 
                src={notification.senderProfilePictureUrl} 
                sx={{ width: 48, height: 48, boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
              >
                {notification.senderUsername[0].toUpperCase()}
              </Avatar>
              
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
                  {getIcon()}
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    {notification.type}
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click to view
                </Typography>
              </Box>

              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); setNotification(null); }}
                sx={{ position: 'absolute', top: 8, right: 8, color: 'text.secondary' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default NotificationToaster;

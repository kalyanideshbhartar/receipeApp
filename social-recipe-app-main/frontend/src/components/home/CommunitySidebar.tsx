import { Box, Typography, Avatar, Paper, Divider, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../../hooks/useWebSocket';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { recipeService, type RecipeSummary } from '../../services/recipe.service';

const CommunitySidebar = () => {
  const { notifications } = useWebSocket();
  const navigate = useNavigate();

  const { data: trendingRecipes = [] } = useQuery({
    queryKey: ['recipes', 'trending'],
    queryFn: () => recipeService.getTrendingRecipes(10),
  });

  const popularChefs = useMemo(() => {
    const authorsMap = new Map();
    trendingRecipes.forEach((r: RecipeSummary) => {
      if (r.author && !authorsMap.has(r.author.username)) {
        authorsMap.set(r.author.username, r.author);
      }
    });
    return Array.from(authorsMap.values()).slice(0, 3);
  }, [trendingRecipes]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <FavoriteIcon sx={{ color: 'error.main', fontSize: 14 }} />;
      case 'COMMENT': return <CommentIcon sx={{ color: 'primary.main', fontSize: 14 }} />;
      case 'FOLLOW': return <PersonAddIcon sx={{ color: 'secondary.main', fontSize: 14 }} />;
      default: return null;
    }
  };

  // Only show the last 8 activities
  const recentActivity = notifications.slice(0, 8);

  return (
    <Paper 
      className="glass-card" 
      sx={{ 
        p: 3, 
        borderRadius: 4, 
        position: 'sticky', 
        top: 100,
        display: { xs: 'none', lg: 'block' }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
        <Box sx={{ width: 8, height: 8, bgcolor: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />
        <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: '-0.02em' }}>
          Community Pulse
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <AnimatePresence initial={false}>
          {recentActivity.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 1.5, 
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  '&:hover .sender-name': { color: 'primary.main' }
                }}
                onClick={() => {
                  if (notif.recipeId) navigate(`/recipes/${notif.recipeId}`);
                  else navigate(`/profile/${notif.senderUsername}`);
                }}
              >
                <Avatar 
                  src={notif.senderProfilePictureUrl} 
                  sx={{ width: 36, height: 36, fontWeight: 900, fontSize: 14 }}
                >
                  {notif.senderUsername[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
                    <Typography className="sender-name" variant="subtitle2" sx={{ fontWeight: 900, fontSize: '0.85rem', transition: 'color 0.2s' }}>
                      @{notif.senderUsername}
                    </Typography>
                    {getActionIcon(notif.type)}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.3, display: 'block' }}>
                    {notif.message.replace(notif.senderUsername, '').trim()}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>

        {recentActivity.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4, fontWeight: 600 }}>
            Quiet for now... Be the first to start the trend!
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3, opacity: 0.08 }} />

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 950, mb: 2, color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Popular Chefs to Follow
        </Typography>
        {/* Placeholder for trending users - in Phase 2 we can fetch actual trending users */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {popularChefs.map((chef) => (
            <Box key={chef.username} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/profile/${chef.username}`)}>
                <Avatar src={chef.profilePictureUrl} sx={{ width: 32, height: 32, fontWeight: 900, fontSize: 12 }}>{chef.username[0].toUpperCase()}</Avatar>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: '0.8rem' }}>{chef.username} {chef.isVerified && <VerifiedIcon sx={{ fontSize: 12, color: 'primary.main' }} />}</Typography>
              </Box>
              <Button size="small" variant="outlined" sx={{ borderRadius: 2, fontWeight: 800, fontSize: '0.7rem', minWidth: 60, py: 0.2 }}>Follow</Button>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default CommunitySidebar;

import { 
  Box, Container, Typography, Grid, Card, 
  CardContent, CardMedia, Button
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import GrassIcon from '@mui/icons-material/Grass';

const COMMUNITIES = [
  {
    id: 'keto-warriors',
    name: 'Keto Warriors',
    description: 'Master the art of low-carb living with 50k+ members.',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80',
    memberCount: '52.4k',
    recipesCount: '12.8k',
    icon: <LocalFireDepartmentIcon sx={{ color: '#F59E0B' }} />,
    color: '#F59E0B'
  },
  {
    id: 'plant-based-life',
    name: 'Plant-Based Life',
    description: 'Sustainable, delicious, and entirely from the earth.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80',
    memberCount: '38.2k',
    recipesCount: '9.5k',
    icon: <GrassIcon sx={{ color: '#10B981' }} />,
    color: '#10B981'
  },
  {
    id: 'bakers-corner',
    name: "Baker's Corner",
    description: 'From sourdough starters to decadent pastries.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80',
    memberCount: '25.9k',
    recipesCount: '7.2k',
    icon: <GroupsIcon sx={{ color: '#EC4899' }} />,
    color: '#EC4899'
  }
];

const CommunitiesPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: 6, bgcolor: '#F9FAFB', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h2" sx={{ fontWeight: 950, mb: 2, letterSpacing: '-0.04em' }}>
            Communities
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Join specialized groups to discover recipes that fit your lifestyle.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {COMMUNITIES.map((community, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={community.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card 
                  onClick={() => navigate(`/communities/${community.id}`)}
                  sx={{ 
                    borderRadius: 4, 
                    overflow: 'hidden', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.03)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Box sx={{ position: 'relative', pt: '56.25%' }}>
                    <CardMedia
                      component="img"
                      image={community.image}
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    />
                    <Box sx={{ 
                      position: 'absolute', top: 16, left: 16,
                      p: 1, borderRadius: 2, bgcolor: 'white',
                      display: 'flex', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      {community.icon}
                    </Box>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
                      {community.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
                      {community.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', display: 'block', mb: 0.5 }}>
                          MEMBERS
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                          {community.memberCount}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', display: 'block', mb: 0.5 }}>
                          RECIPES
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                          {community.recipesCount}
                        </Typography>
                      </Box>
                    </Box>

                    <Button 
                      fullWidth 
                      variant="contained" 
                      sx={{ 
                        mt: 4, borderRadius: 2, py: 1.5, fontWeight: 800,
                        bgcolor: community.color,
                        '&:hover': { bgcolor: community.color, opacity: 0.9 }
                      }}
                    >
                      Join Community
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default CommunitiesPage;

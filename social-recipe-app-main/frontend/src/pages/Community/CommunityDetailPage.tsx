import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Grid, Button, 
  Paper, Tab, Tabs
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useState } from 'react';
import RecipeCard from '../../components/recipes/RecipeCard';
import { useQuery } from '@tanstack/react-query';
import { recipeService, type RecipeSummary } from '../../services/recipe.service';

const CommunityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Mock data for community header
  const communityInfo = {
    'keto-warriors': { name: 'Keto Warriors', members: '52.4k', banner: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80' },
    'plant-based-life': { name: 'Plant-Based Life', members: '38.2k', banner: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80' },
    'bakers-corner': { name: "Baker's Corner", members: '25.9k', banner: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80' }
  }[id || 'keto-warriors'];

  // Fetch recipes (we'll filter them by "community" tag or just use search for now)
  const { data: recipes = [] } = useQuery({
    queryKey: ['community-recipes', id],
    queryFn: () => recipeService.getExploreFeed(undefined, id).then(res => res.content.slice(0, 6))
  });

  return (
    <Box sx={{ pb: 8 }}>
      {/* Banner */}
      <Box sx={{ position: 'relative', height: 300, overflow: 'hidden' }}>
        <Box 
          component="img"
          src={communityInfo?.banner}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)' }} />
        <Container maxWidth="lg" sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: 'white' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/communities')}
            sx={{ color: 'white', position: 'absolute', top: 24, left: 16, textTransform: 'none', fontWeight: 700 }}
          >
            Back to Hub
          </Button>
          <Typography variant="h2" sx={{ fontWeight: 950, mb: 1, letterSpacing: '-0.03em' }}>
            {communityInfo?.name}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
            {communityInfo?.members} passionate cooks sharing secrets.
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="lg" sx={{ mt: -4, position: 'relative' }}>
        <Paper sx={{ borderRadius: 4, p: 1, mb: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', px: 4 },
              '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
            }}
          >
            <Tab label="Feed" />
            <Tab label="Discuss" />
            <Tab label="Leaderboard" />
          </Tabs>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>Community Recipes</Typography>
          <Button startIcon={<FilterListIcon />} variant="outlined" sx={{ borderRadius: 2, fontWeight: 800 }}>
            Filter
          </Button>
        </Box>

        <Grid container spacing={3}>
          {recipes.map((recipe: RecipeSummary) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default CommunityDetailPage;

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useNavigate } from 'react-router-dom';
import type { RecipeSummary } from '../../services/recipe.service';

interface HeroCarouselProps {
  recipes: RecipeSummary[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ recipes }) => {
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const maxSteps = Math.min(recipes.length, 5);

  useEffect(() => {
    if (recipes.length === 0) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % maxSteps);
    }, 6000);
    return () => clearInterval(timer);
  }, [maxSteps, recipes.length]);

  if (recipes.length === 0) return null;

  const handleNext = () => setActiveStep((prev) => (prev + 1) % maxSteps);
  const handleBack = () => setActiveStep((prev) => (prev - 1 + maxSteps) % maxSteps);

  const currentRecipe = recipes[activeStep];

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: { xs: 350, sm: 500 }, 
      borderRadius: 2, 
      overflow: 'hidden',
      mb: 6,
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
    }}>
      {/* Background Image */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${currentRecipe.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 0.8s ease-in-out',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)',
          }
        }}
      />

      {/* Content */}
      <Box sx={{ 
        position: 'relative', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        px: { xs: 4, sm: 8 },
        maxWidth: { xs: '100%', sm: '60%' },
        color: 'white',
        zIndex: 2
      }}>
        <Typography 
          variant="overline" 
          sx={{ color: 'secondary.main', fontWeight: 800, letterSpacing: 2, mb: 1 }}
        >
          Featured Recipe
        </Typography>
        <Typography 
          variant={isMobile ? "h4" : "h2"} 
          sx={{ mb: 2, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
        >
          {currentRecipe.title}
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 4, 
            opacity: 0.9, 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {currentRecipe.description}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="secondary"
            size="large"
            onClick={() => navigate(`/recipes/${currentRecipe.id}`)}
          >
            View Recipe
          </Button>
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>By {currentRecipe.author.username}</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Navigation Controls */}
      {!isMobile && (
        <>
          <IconButton 
            onClick={handleBack}
            sx={{ 
              position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
              color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
          <IconButton 
            onClick={handleNext}
            sx={{ 
              position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
              color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </>
      )}

      {/* Progress Dots */}
      <Box sx={{ 
        position: 'absolute', bottom: 30, right: 30, 
        display: 'flex', gap: 1, zIndex: 10 
      }}>
        {Array.from({ length: maxSteps }).map((_, i) => (
          <Box 
            key={i}
            sx={{ 
              width: activeStep === i ? 24 : 8, 
              height: 8, 
              borderRadius: 1, 
              bgcolor: activeStep === i ? 'secondary.main' : 'rgba(255,255,255,0.3)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default HeroCarousel;

import { Box, Typography, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import StarIcon from '@mui/icons-material/Star';

const FEATURED_ITEMS = [
  {
    id: 1,
    title: 'Autumn Harvest Pumpkin Risotto',
    description: 'A creamy, comforting masterpiece featuring hand-picked sage and roasted pepitas.',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80',
    tags: ['Editor Choice', 'Seasonal'],
    author: 'Chef Isabella'
  },
  {
    id: 2,
    title: 'Artisan Sourdough Experience',
    description: 'Unlock the secrets of the perfect crust and an airy, tangy crumb.',
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80',
    tags: ['Premium', 'Baking'],
    author: 'The Baker Collective'
  },
  {
    id: 3,
    title: 'Wild-Caught Salmon with Citrus Glaze',
    description: 'Fresh, vibrant, and packed with Omega-3. The ultimate health-conscious dinner.',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80',
    tags: ['Verified', 'Quick'],
    author: 'Chef Marcus'
  }
];

const FeaturedRecipeCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FEATURED_ITEMS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % FEATURED_ITEMS.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? FEATURED_ITEMS.length - 1 : prev - 1));

  return (
    <Box sx={{ position: 'relative', mb: 8, overflow: 'hidden', borderRadius: { xs: 0, md: 5 }, mx: { xs: -2, md: 0 } }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
          style={{ position: 'relative', width: '100%', aspectRatio: '21/9', minHeight: '400px' }}
        >
          <Box
            component="img"
            src={FEATURED_ITEMS[currentIndex].image}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <Box sx={{ 
            position: 'absolute', inset: 0, 
            background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
            display: 'flex', alignItems: 'center', px: { xs: 4, md: 10 }
          }}>
            <Box sx={{ maxWidth: 600, color: 'white' }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {FEATURED_ITEMS[currentIndex].tags.map((tag) => (
                  <Box key={tag} sx={{ 
                    bgcolor: 'primary.main', px: 1.5, py: 0.5, borderRadius: 1.5,
                    display: 'flex', alignItems: 'center', gap: 0.5
                  }}>
                    <StarIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" sx={{ fontWeight: 900, letterSpacing: '0.05em' }}>{tag.toUpperCase()}</Typography>
                  </Box>
                ))}
              </Box>
              <Typography variant="h2" sx={{ fontWeight: 950, mb: 2, lineHeight: 1.1, letterSpacing: '-0.04em', fontSize: { xs: '2.5rem', md: '4rem' } }}>
                {FEATURED_ITEMS[currentIndex].title}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.8, mb: 4, fontWeight: 500, lineHeight: 1.6 }}>
                {FEATURED_ITEMS[currentIndex].description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'secondary.main', display: 'flex', alignItems: 'center' }}>
                  By {FEATURED_ITEMS[currentIndex].author}
                </Typography>
                <Box sx={{ width: 1, height: 20, bgcolor: 'rgba(255,255,255,0.2)' }} />
                <Typography 
                  variant="subtitle2" 
                  sx={{ cursor: 'pointer', fontWeight: 900, '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => navigate(`/recipes/${FEATURED_ITEMS[currentIndex].id}`)}
                >
                  View Full Masterpiece →
                </Typography>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </AnimatePresence>

      <Box sx={{ position: 'absolute', bottom: 40, right: 40, display: 'flex', gap: 2 }}>
        <IconButton 
          onClick={handlePrev} 
          sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <IconButton 
          onClick={handleNext} 
          sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default FeaturedRecipeCarousel;

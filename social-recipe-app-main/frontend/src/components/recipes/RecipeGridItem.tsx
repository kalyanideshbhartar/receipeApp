import React from 'react';
import { Box, Typography, styled } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { useNavigate } from 'react-router-dom';
import type { RecipeSummary } from '../../services/recipe.service';

interface RecipeGridItemProps {
  recipe: RecipeSummary;
}

const Overlay = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  opacity: 0,
  transition: 'opacity 0.2s ease-in-out',
  color: 'white',
  gap: '20px',
  cursor: 'pointer',
}));

const GridItemContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  paddingBottom: '100%', // Square aspect ratio
  overflow: 'hidden',
  borderRadius: '8px',
  '&:hover .overlay': {
    opacity: 1,
  },
});

const RecipeGridItem: React.FC<RecipeGridItemProps> = ({ recipe }) => {
  const navigate = useNavigate();

  return (
    <GridItemContainer onClick={() => navigate(`/recipes/${recipe.id}`)}>
      <Box 
        component="img"
        src={recipe.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'}
        alt={recipe.title}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <Overlay className="overlay">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FavoriteIcon />
          <Typography fontWeight={700}>{recipe.likeCount}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ChatBubbleIcon />
          <Typography fontWeight={700}>{recipe.commentCount}</Typography>
        </Box>
      </Overlay>
    </GridItemContainer>
  );
};

export default RecipeGridItem;

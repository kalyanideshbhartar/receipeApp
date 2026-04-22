import { useState, useEffect, useCallback } from 'react';
import { 
  Drawer, Box, Typography, Button, Stack, 
  IconButton, TextField, MenuItem, Avatar,
  List, ListItemButton, ListItemAvatar, ListItemText,
  CircularProgress, InputAdornment, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { mealPlanService } from '../../services/mealPlan.service';
import { recipeService, type RecipeSummary } from '../../services/recipe.service';
import { format, startOfDay, isBefore } from 'date-fns';
import { toast } from 'react-hot-toast';

interface MealPlannerDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date;
  initialType?: string;
}

const MealPlannerDrawer = ({ open, onClose, onSuccess, initialDate, initialType }: MealPlannerDrawerProps) => {
  const [date, setDate] = useState(format(initialDate || new Date(), 'yyyy-MM-dd'));
  const [mealType, setMealType] = useState(initialType || 'DINNER');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (initialDate) setDate(format(initialDate, 'yyyy-MM-dd'));
    if (initialType) setMealType(initialType);
    if (!open) {
        setSearchQuery('');
        setRecipes([]);
        setSelectedRecipe(null);
    }
  }, [initialDate, initialType, open]);

  const handleSearch = useCallback(async () => {
    setSearching(true);
    try {
      const results = await recipeService.searchRecipes(searchQuery);
      setRecipes(results);
    } catch {
      console.error('Search failed');
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    // Prevent search if we just selected a recipe
    if (selectedRecipe && searchQuery === selectedRecipe.title) return;

    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        handleSearch();
      } else {
        setRecipes([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedRecipe, handleSearch]);

  const handleAdd = async () => {
    if (!selectedRecipe) {
        toast.error('Please select a recipe first');
        return;
    }

    const selectedDate = startOfDay(new Date(date));
    const today = startOfDay(new Date());
    if (isBefore(selectedDate, today)) {
        toast.error('Cannot plan for past dates');
        return;
    }

    setLoading(true);
    try {
      await mealPlanService.addMealPlan({
        recipeId: selectedRecipe.id,
        plannedDate: date,
        mealType
      });
      toast.success('Added to your plan!');
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to add to calendar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: { 
          width: { xs: '100%', sm: 480 },
          bgcolor: '#ffffff',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.05)',
          borderLeft: '1px solid #f1f5f9'
        }
      }}
    >
      {/* Header */}
      <Box className="premium-drawer-header">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h5" className="premium-header" sx={{ fontSize: '1.5rem' }}>
            Plan Entry
          </Typography>
          <IconButton onClick={onClose} sx={{ bgcolor: '#f8fafc', '&:hover': { bgcolor: '#f1f5f9' } }}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Schedule a unique culinary experience for your week.
        </Typography>
      </Box>

      <Box sx={{ p: 4 }}>
        <Stack spacing={4}>
          {/* Controls Section */}
          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Execution Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#ffffff' },
                  '& .MuiInputLabel-root': { fontWeight: 700 }
                }}
              />
              <TextField
                select
                label="Meal Window"
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                fullWidth
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#ffffff' },
                  '& .MuiInputLabel-root': { fontWeight: 700 }
                }}
              >
                {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Stack>
          </Box>

          <Divider sx={{ opacity: 0.6 }} />

          {/* Search Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1.5, color: 'text.primary', letterSpacing: '0.05em' }}>
              SELECT RECIPE
            </Typography>
            <TextField
              placeholder="Ex: Moroccan Tagine, Classic Pesto..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedRecipe) setSelectedRecipe(null);
              }}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                endAdornment: searching && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' } }}
            />

            {/* Results */}
            <Box sx={{ mt: 2, maxHeight: 400, overflowY: 'auto' }}>
              {selectedRecipe && recipes.length === 0 && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar variant="rounded" src={selectedRecipe.imageUrl} sx={{ width: 40, height: 40, borderRadius: '8px' }} />
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedRecipe.title} (Selected)</Typography>
                  <Button size="small" onClick={() => setSelectedRecipe(null)} sx={{ ml: 'auto' }}>Change</Button>
                </Box>
              )}
              <List sx={{ p: 0 }}>
                {recipes.map((recipe) => (
                  <ListItemButton 
                    key={recipe.id}
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setRecipes([]);
                      setSearchQuery(''); // Clear search to show the "Selected" box above
                    }}
                    sx={{ 
                      py: 2, px: 2,
                      borderRadius: '16px',
                      mb: 1,
                      border: '1px solid',
                      borderColor: selectedRecipe?.id === recipe.id ? 'primary.main' : '#f1f5f9',
                      bgcolor: selectedRecipe?.id === recipe.id ? '#f5f7ff' : '#ffffff',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: '#f8fafc', transform: 'translateX(4px)' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        variant="rounded" 
                        src={recipe.imageUrl} 
                        sx={{ width: 56, height: 56, borderRadius: '12px' }} 
                      />
                    </ListItemAvatar>
                    <ListItemText 
                      primary={<Typography variant="body1" sx={{ fontWeight: 800 }}>{recipe.title}</Typography>}
                      secondary={<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{recipe.calories || 0} kcal • Ready in {recipe.prepTimeMinutes + recipe.cookTimeMinutes}m</Typography>}
                    />
                  </ListItemButton>
                ))}
                {searchQuery.length > 2 && recipes.length === 0 && !searching && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 600 }}>Zero matches found</Typography>
                  </Box>
                )}
              </List>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Footer CTA */}
      <Box sx={{ p: 4, mt: 'auto', borderTop: '1px solid #f1f5f9' }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleAdd}
          disabled={loading}
          startIcon={<CalendarMonthIcon />}
          sx={{ 
            borderRadius: '16px', 
            py: 2, 
            fontWeight: 900,
            fontSize: '1rem',
            bgcolor: 'primary.main',
            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.25)',
            textTransform: 'none',
            '&:hover': { bgcolor: 'primary.dark', transform: 'translateY(-2px)' }
          }}
        >
          {loading ? 'Confirming...' : 'Add to Calendar'}
        </Button>
      </Box>
    </Drawer>
  );
};

export default MealPlannerDrawer;

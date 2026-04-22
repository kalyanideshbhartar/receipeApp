import { useState, useEffect } from 'react';
import { 
  Box, Typography, Slider, 
  Button, Divider, Stack, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SortIcon from '@mui/icons-material/Sort';

interface FilterSidebarProps {
  filters: {
    maxTime: number;
    maxCalories: number;
    sort: string[];
  };
  onFilterChange: (filters: { maxTime: number; maxCalories: number; sort: string[] }) => void;
  onReset: () => void;
}

const FilterSidebar = ({ filters, onFilterChange, onReset }: FilterSidebarProps) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Sync local filters when parent filters change (important for reset)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    onReset();
    setLocalFilters({ maxTime: 180, maxCalories: 2000, sort: ['newest'] });
  };

  const handleSortChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSorts: string[],
  ) => {
    // If user deselects all, default to newest or just allow empty
    setLocalFilters({ ...localFilters, sort: newSorts.length > 0 ? newSorts : ['newest'] });
  };

  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: 'background.paper', 
      borderRadius: 4, 
      border: '1px solid #E2E8F0',
      position: 'sticky',
      top: 100
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
          Filters
        </Typography>
        <Button 
          startIcon={<RestartAltIcon />} 
          size="small" 
          onClick={handleReset}
          sx={{ color: 'text.secondary', fontWeight: 700 }}
        >
          Reset
        </Button>
      </Box>

      <Stack spacing={4}>
        {/* Sort By - Multi-select Toggle Buttons */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <SortIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sort Selection
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={localFilters.sort}
            onChange={handleSortChange}
            aria-label="recipe sorting"
            fullWidth
            orientation="vertical"
            sx={{ 
              gap: 1,
              '& .MuiToggleButton-root': {
                border: '1px solid #e2e8f0 !important',
                borderRadius: '12px !important',
                py: 1,
                px: 2,
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontWeight: 700,
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  borderColor: 'primary.main !important',
                  '&:hover': { bgcolor: 'primary.dark' }
                }
              }
            }}
          >
            <ToggleButton value="newest" aria-label="newest">
              ✨ Newest First
            </ToggleButton>
            <ToggleButton value="trending" aria-label="trending">
              🔥 Trending Now
            </ToggleButton>
            <ToggleButton value="rating" aria-label="rating">
              ⭐ Top Rated
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider />

        {/* Max Cooking Time */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Max Time
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {localFilters.maxTime} mins
            </Typography>
          </Box>
          <Slider
            value={localFilters.maxTime}
            min={0}
            max={180}
            step={5}
            onChange={(_, value) => setLocalFilters({ ...localFilters, maxTime: value as number })}
            valueLabelDisplay="auto"
            sx={{ color: 'primary.main' }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.disabled">0</Typography>
            <Typography variant="caption" color="text.disabled">180+</Typography>
          </Box>
        </Box>

        <Divider />

        {/* Max Calories */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Max Calories
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {localFilters.maxCalories} kcal
            </Typography>
          </Box>
          <Slider
            value={localFilters.maxCalories}
            min={0}
            max={2000}
            step={50}
            onChange={(_, value) => setLocalFilters({ ...localFilters, maxCalories: value as number })}
            valueLabelDisplay="auto"
            sx={{ color: 'primary.main' }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.disabled">0</Typography>
            <Typography variant="caption" color="text.disabled">2000+</Typography>
          </Box>
        </Box>
      </Stack>

      <Button 
        variant="contained" 
        fullWidth 
        onClick={handleApply}
        sx={{ 
          mt: 4, 
          py: 1.5, 
          borderRadius: 3, 
          fontWeight: 800,
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(44, 62, 80, 0.15)' }
        }}
      >
        Apply Filters
      </Button>
    </Box>
  );
};

export default FilterSidebar;

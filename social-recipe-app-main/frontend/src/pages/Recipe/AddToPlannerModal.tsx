import { useState } from 'react';
import { 
  Modal, Box, Typography, Button, Stack, 
  IconButton, TextField, MenuItem 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { mealPlanService } from '../../services/mealPlan.service';
import { format } from 'date-fns';

interface AddToPlannerModalProps {
  open: boolean;
  onClose: () => void;
  recipeId: number;
  recipeTitle: string;
}

const AddToPlannerModal = ({ open, onClose, recipeId, recipeTitle }: AddToPlannerModalProps) => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealType, setMealType] = useState('DINNER');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    try {
      await mealPlanService.addMealPlan({
        recipeId,
        plannedDate: date,
        mealType
      });
      onClose();
    } catch (err) {
      console.error('Failed to add to planner', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 450, p: 4, borderRadius: '24px', outline: 'none',
        bgcolor: '#ffffff',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        border: '1px solid #f1f5f9'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>Plan this Meal</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', fontWeight: 500 }}>
          Scheduling <b>{recipeTitle}</b> to your culinary calendar
        </Typography>

        <Stack spacing={3}>
          <TextField
            label="Planned Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
          />

          <TextField
            select
            label="Meal Type"
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
          >
            {['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleAdd}
            disabled={loading}
            startIcon={<CalendarMonthIcon />}
            sx={{ borderRadius: '14px', py: 1.5, fontWeight: 900 }}
          >
            {loading ? 'Adding...' : 'Add to Calendar'}
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default AddToPlannerModal;

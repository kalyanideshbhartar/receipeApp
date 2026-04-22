import { useState, useEffect, useCallback } from 'react';
import { 
  Container, Typography, Box, Paper, Grid, 
  IconButton, Card, CardMedia, CardContent,
  Stack, CircularProgress, Alert,
  Button
} from '@mui/material';
import { motion } from 'framer-motion';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { mealPlanService, type MealPlan } from '../../services/mealPlan.service';
import { toast } from 'react-hot-toast';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AddIcon from '@mui/icons-material/Add';
import MealPlannerDrawer from '../../components/planner/MealPlannerDrawer';
import { isBefore, isToday, startOfDay } from 'date-fns';

const MealPlannerPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      const data = await mealPlanService.getMealPlans(start, end);
      setPlans(data);
    } catch {
      setError('Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDelete = async (id: number) => {
    try {
      if (window.confirm('Remove this meal from your plan?')) {
        await mealPlanService.deleteMealPlan(id);
        setPlans(plans.filter(p => p.id !== id));
        toast.success('Meal removed');
      }
    } catch {
      console.error('Delete failed');
      toast.error('Failed to remove meal');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const updated = await mealPlanService.updateMealPlan(id, { status });
      setPlans(plans.map(p => p.id === id ? updated : p));
      toast.success(`Marked as ${status.toLowerCase()}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const renderHeader = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant="h3" className="premium-header" sx={{ fontSize: '2.5rem', mb: 0.5 }}>
            Meal Flow
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Engineer your week's culinary trajectory
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => {
                setSelectedDate(new Date());
                setSelectedType('DINNER');
                setIsAddModalOpen(true);
            }}
            sx={{ 
                borderRadius: '14px', 
                fontWeight: 900, 
                px: 3.5, 
                py: 1.5,
                bgcolor: 'primary.main',
                boxShadow: '0 10px 25px rgba(99, 102, 241, 0.25)',
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': { transform: 'translateY(-2px)', bgcolor: 'primary.dark' }
            }}
          >
            Create Plan
          </Button>

          <Box sx={{ p: 0.8, borderRadius: '18px', display: 'flex', alignItems: 'center', bgcolor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
            <IconButton onClick={() => setCurrentDate(addDays(currentDate, -7))}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="body2" sx={{ fontWeight: 800, minWidth: 120, textAlign: 'center' }}>
              {format(currentDate, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={() => setCurrentDate(addDays(currentDate, 7))}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderDays = () => {
    const start = startOfWeek(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = addDays(start, i);
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayPlans = plans.filter(p => p.plannedDate === dayStr);
        const totalCalories = dayPlans.reduce((sum, p) => sum + (p.calories || 0), 0);

        days.push(
          <Grid size={1} key={i}>
            <Box sx={{ 
                textAlign: 'center', 
                py: 2.5, 
                borderRadius: '20px 20px 0 0',
                bgcolor: isToday(day) ? '#eef2ff' : '#ffffff',
                border: isToday(day) ? '1px solid' : 'none',
                borderColor: '#e2e8f0'
            }}>
                <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: isToday(day) ? 'primary.main' : 'text.disabled' }}>
                    {format(day, 'EEE')}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 950, color: isToday(day) ? 'primary.main' : '#1e293b', mt: 0.5 }}>
                    {format(day, 'd')}
                </Typography>
                {totalCalories > 0 && (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', bgcolor: '#f1f5f9', px: 1, py: 0.2, borderRadius: 1 }}>
                            {totalCalories} kcal
                        </Typography>
                    </Box>
                )}
            </Box>
          </Grid>
        );
    }
    return <Grid container spacing={2} columns={7} sx={{ mb: 0 }}>{days}</Grid>;
  };

  const isPastDay = (date: Date) => {
    return isBefore(startOfDay(date), startOfDay(new Date()));
  };

  const renderCells = () => {
    const start = startOfWeek(currentDate);
    const rows = [];
    
    for (let i = 0; i < 7; i++) {
        const day = addDays(start, i);
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayPlans = plans.filter(p => p.plannedDate === dayStr);
        
        rows.push(
            <Grid size={1} key={i}>
                <Paper 
                    className="premium-card" 
                    sx={{ 
                        minHeight: 500, 
                        p: 2.5, 
                        bgcolor: isSameDay(day, new Date()) ? '#f5f7ff' : '#ffffff',
                        border: isSameDay(day, new Date()) ? '2px solid #ccd1ff' : '1px solid #f1f5f9'
                    }}
                >
                    <Stack spacing={2}>
                        {['BREAKFAST', 'LUNCH', 'DINNER'].map(type => {
                            const meal = dayPlans.find(p => p.mealType === type);
                            return (
                                <Box key={type} sx={{ minHeight: 100 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', mb: 1, display: 'block' }}>
                                        {type}
                                    </Typography>
                                    {meal ? (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                            <Card sx={{ 
                                                borderRadius: '20px', 
                                                overflow: 'hidden', 
                                                boxShadow: '0 8px 20px rgba(0,0,0,0.04)', 
                                                position: 'relative',
                                                border: '1px solid',
                                                borderColor: meal.status === 'EATEN' ? 'success.light' : '#f1f5f9',
                                                opacity: meal.status === 'SKIPPED' ? 0.6 : 1,
                                                bgcolor: 'background.paper',
                                                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 28px rgba(0,0,0,0.08)' },
                                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                            }}>
                                                <CardMedia component="img" height="70" image={meal.recipeImageUrl} />
                                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 900, fontSize: '0.75rem', lineHeight: 1.2, mb: 1, height: 32, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                        {meal.recipeTitle}
                                                    </Typography>
                                                    
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                                        <Stack direction="row" spacing={0.2} sx={{ bgcolor: '#f1f5f9', borderRadius: '10px', p: 0.2 }}>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleStatusChange(meal.id, 'EATEN')}
                                                                sx={{ p: 0.4, color: meal.status === 'EATEN' ? 'success.main' : 'text.disabled' }}
                                                            >
                                                                <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleStatusChange(meal.id, 'SKIPPED')}
                                                                sx={{ p: 0.4, color: meal.status === 'SKIPPED' ? 'error.main' : 'text.disabled' }}
                                                            >
                                                                <BlockIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={() => handleStatusChange(meal.id, 'PLANNED')}
                                                                sx={{ p: 0.4, color: meal.status === 'PLANNED' ? 'primary.main' : 'text.disabled' }}
                                                            >
                                                                <ScheduleIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Stack>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(meal.id); }}
                                                            sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'error.main', bgcolor: '#fee2e2' } }}
                                                        >
                                                            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Box>
                                                </CardContent>
                                                {meal.calories && (
                                                    <Box sx={{ position: 'absolute', top: 6, left: 6, bgcolor: '#000000', color: 'white', px: 1, py: 0.3, borderRadius: '8px' }}>
                                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 950 }}>{meal.calories} cal</Typography>
                                                    </Box>
                                                )}
                                            </Card>
                                        </motion.div>
                                    ) : (
                                        !isPastDay(day) && (
                                            <Box 
                                                sx={{ 
                                                    height: 60, 
                                                    border: '1.5px dashed', 
                                                    borderColor: '#e2e8f0',
                                                    borderRadius: '16px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    color: 'text.disabled',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': { 
                                                        bgcolor: '#f5f7ff', 
                                                        borderColor: 'primary.light',
                                                        color: 'primary.main',
                                                        transform: 'scale(1.02)'
                                                    }
                                                }}
                                                onClick={() => {
                                                    setSelectedDate(day);
                                                    setSelectedType(type);
                                                    setIsAddModalOpen(true);
                                                }}
                                            >
                                                <AddIcon sx={{ fontSize: 20 }} />
                                            </Box>
                                        )
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>
                </Paper>
            </Grid>
        );
    }
    return <Grid container spacing={2} columns={7}>{rows}</Grid>;
  };

  return (
    <Box className="bg-mesh" sx={{ minHeight: '100vh', py: 8 }}>
      <Container maxWidth="xl">
        {renderHeader()}
        
        {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '16px' }}>{error}</Alert>}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}><CircularProgress /></Box>
        ) : (
          <Box>
            {renderDays()}
            {renderCells()}
          </Box>
        )}
      </Container>

      <MealPlannerDrawer 
        open={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchPlans}
        initialDate={selectedDate}
        initialType={selectedType}
      />
    </Box>
  );
};

export default MealPlannerPage;

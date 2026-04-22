import { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Checkbox, 
  Button, TextField, Stack, 
  CircularProgress, Alert, Chip, Grid
} from '@mui/material';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import { motion, AnimatePresence } from 'framer-motion';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AddIcon from '@mui/icons-material/Add';
import { shoppingListService, type ShoppingListItem } from '../../services/shoppingList.service';

const ShoppingListPage = () => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await shoppingListService.getItems();
      setItems(data);
    } catch {
      setError('Failed to load shopping list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleToggle = async (id: number) => {
    try {
      const updated = await shoppingListService.togglePurchased(id);
      setItems(items.map(item => item.id === id ? updated : item));
    } catch {
      console.error('Toggle failed');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    try {
      const item = await shoppingListService.addItem({ name: newItemName });
      setItems([...items, item]);
      setNewItemName('');
    } catch {
      console.error('Add failed');
    }
  };

  const handleDeleteChecked = async () => {
    try {
      await shoppingListService.deleteChecked();
      setItems(items.filter(item => !item.purchased));
    } catch {
      console.error('Delete checked failed');
    }
  };

  const pendingItems = items.filter(i => !i.purchased);
  const purchasedItems = items.filter(i => i.purchased);

  // Group pending items by category
  const groupedItems = pendingItems.reduce((acc, item) => {
    const cat = item.category || 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  const categories = Object.keys(groupedItems).sort((a, b) => a.localeCompare(b));

  return (
    <Box className="bg-mesh" sx={{ minHeight: '100vh', py: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
          <Box>
            <Typography variant="h2" sx={{ fontWeight: 950, letterSpacing: '-0.04em' }}>
              Pantry Provisions
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Manage your culinary essentials
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={handleDeleteChecked}
            disabled={purchasedItems.length === 0}
            sx={{ borderRadius: '14px', fontWeight: 800, textTransform: 'none', px: 3 }}
          >
            Clear Purchased
          </Button>
        </Box>

        <Paper className="glass-card" sx={{ p: 4, borderRadius: '32px', mb: 4 }}>
          <form onSubmit={handleAddItem}>
            <Stack direction="row" spacing={2}>
              <TextField 
                fullWidth
                placeholder="Add new ingredient (e.g., 500g Fresh Basil)..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: '16px',
                    bgcolor: 'rgba(0,0,0,0.02)'
                  }
                }}
              />
              <Button 
                type="submit"
                variant="contained" 
                startIcon={<AddIcon />}
                disabled={!newItemName.trim()}
                sx={{ borderRadius: '16px', px: 4, fontWeight: 900 }}
              >
                Add
              </Button>
            </Stack>
          </form>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={4}>
            {error && <Alert severity="error">{error}</Alert>}

            <Stack spacing={3}>
                {categories.map((cat) => (
                  <Box key={cat}>
                    <Typography
                      variant="overline"
                      sx={{
                        fontWeight: 900,
                        color: 'primary.main',
                        letterSpacing: '0.1em',
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'rgba(0,0,0,0.03)',
                        p: 1.2,
                        borderRadius: '14px',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' },
                        gap: 1,
                        mb: 1.5,
                        px: 1
                      }}
                    >
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                      {cat}
                    </Typography>
                    <Paper className="glass" sx={{ borderRadius: '24px', overflow: 'hidden' }}>
                      <AnimatePresence>
                        {groupedItems[cat].map((item) => (
                          <motion.div 
                              key={item.id} 
                              initial={{ opacity: 0, x: -20 }} 
                              animate={{ opacity: 1, x: 0 }} 
                              exit={{ opacity: 0, x: 20 }}
                          >
                            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', '&:last-child': { borderBottom: 'none' } }}>
                              <Checkbox checked={item.purchased} onChange={() => handleToggle(item.id)} sx={{ mr: 2 }} />
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                  {(item.quantity || item.unit) && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                      {item.quantity} {item.unit}
                                    </Typography>
                                  )}
                                  {item.recipeTitle && (
                                    <Chip 
                                      label={item.recipeTitle} 
                                      size="small" 
                                      variant="outlined" 
                                      onClick={() => item.recipeId && window.open(`/recipes/${item.recipeId}`, '_blank')}
                                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, color: 'primary.main', borderColor: 'primary.light' }} 
                                    />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </Paper>
                  </Box>
                ))}
                {pendingItems.length === 0 && (
                  <Paper sx={{ borderRadius: '32px', p: 8, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.5)', border: '2px dashed #e2e8f0' }}>
                    <Box sx={{ mb: 4, display: 'inline-flex', p: 3, borderRadius: '50%', bgcolor: '#f8fafc' }}>
                      <ShoppingBasketIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 2, letterSpacing: '-0.02em' }}>
                      Your Pantry is Ready
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 6, maxWidth: 500, mx: 'auto', fontWeight: 500, lineHeight: 1.6 }}>
                      Start your culinary journey by adding ingredients manually above, or import them directly from your favorite recipes!
                    </Typography>
                    
                    <Grid container spacing={3} sx={{ maxWidth: 700, mx: 'auto', textAlign: 'left' }}>
                      {[
                        { title: 'Import from Recipes', desc: 'Add ingredients from any recipe page with one click.', icon: '🛒' },
                        { title: 'Meal Plan Sync', desc: 'Automatically gather everything needed for your entire week.', icon: '📅' },
                        { title: 'Smart Aisle Layout', desc: 'We automatically group your items by category (Produce, Dairy, etc.).', icon: '🏷️' }
                      ].map((feature) => (
                        <Grid size={{ xs: 12, md: 4 }} key={feature.title}>
                          <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: 'white', height: '100%', border: '1px solid #f1f5f9' }}>
                            <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>{feature.icon}</Typography>
                            <Typography sx={{ fontWeight: 800, mb: 0.5, fontSize: '0.9rem' }}>{feature.title}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 500, lineHeight: 1.4 }}>{feature.desc}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                )}
              </Stack>

            {purchasedItems.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, px: 1, color: 'text.disabled' }}>
                  Acquired
                </Typography>
                <Paper className="glass" sx={{ borderRadius: '24px', overflow: 'hidden', opacity: 0.6 }}>
                  {purchasedItems.map((item) => (
                    <Box key={item.id} sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', '&:last-child': { borderBottom: 'none' } }}>
                      <Checkbox checked={item.purchased} onChange={() => handleToggle(item.id)} sx={{ mr: 2 }} />
                      <Typography sx={{ fontWeight: 600, textDecoration: 'line-through', color: 'text.secondary' }}>{item.name}</Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default ShoppingListPage;

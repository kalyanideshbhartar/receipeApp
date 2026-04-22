import { useState } from 'react';
import { 
  Box, Container, Typography, TextField, Button, 
  Paper, List, ListItem, ListItemText, ListItemIcon,
  CircularProgress, Alert
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ImporterPage = () => {
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState(0);

  const handleImport = () => {
    if (!url) return toast.error('Please enter a valid URL');
    
    setIsImporting(true);
    setImportStep(1);

    // Simulate multi-step import process
    setTimeout(() => setImportStep(2), 1500);
    setTimeout(() => setImportStep(3), 3000);
    setTimeout(() => {
      setIsImporting(false);
      setImportStep(0);
      setUrl('');
      toast.success('Recipe imported successfully! Check your drafts.');
    }, 4500);
  };

  const steps = [
    "Analyzing URL structure...",
    "Extracting ingredients and measurements...",
    "Optimizing culinary instructions..."
  ];

  return (
    <Box sx={{ py: 10, bgcolor: '#F9FAFB', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Box sx={{ 
              display: 'inline-flex', p: 2, borderRadius: 3, 
              bgcolor: 'primary.main', color: 'white', mb: 3,
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
            }}>
              <AutoFixHighIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 950, mb: 2, letterSpacing: '-0.04em' }}>
              Magic Recipe Importer
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500, maxWidth: 600, mx: 'auto' }}>
              Seen a recipe on a blog? Paste the link below and our AI will extract it into your personal collection instantly.
            </Typography>
          </Box>

          <Paper sx={{ p: 4, borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <TextField
                fullWidth
                placeholder="https://culinary-blog.com/famous-pasta-recipe"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isImporting}
                InputProps={{
                  startAdornment: <ContentPasteIcon sx={{ color: 'text.disabled', mr: 1 }} />,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#FDFEFE' } }}
              />
              <Button
                variant="contained"
                size="large"
                onClick={handleImport}
                disabled={isImporting || !url}
                sx={{ 
                  borderRadius: 3, px: 4, fontWeight: 800, textTransform: 'none',
                  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
                }}
              >
                {isImporting ? 'Magic Working...' : 'Import'}
              </Button>
            </Box>

            <AnimatePresence>
              {isImporting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Box sx={{ p: 3, bgcolor: '#f5f7ff', borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                      <CircularProgress size={24} thickness={6} />
                      <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {steps[importStep - 1]}
                      </Typography>
                    </Box>
                    <List sx={{ p: 0 }}>
                      {steps.map((step, idx) => (
                        <ListItem key={idx} sx={{ px: 0, opacity: importStep > idx + 1 ? 1 : 0.4 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {importStep > idx + 1 ? 
                              <CheckCircleOutlineIcon sx={{ color: 'success.main' }} /> : 
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #ccc' }} />
                            }
                          </ListItemIcon>
                          <ListItemText 
                            primary={step} 
                            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {!isImporting && (
              <Alert severity="info" sx={{ borderRadius: 3, bgcolor: 'rgba(0,0,0,0.02)', border: 'none' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Supported sites: Any public culinary blog or recipe site. 
                </Typography>
              </Alert>
            )}
          </Paper>

          <Box sx={{ mt: 6, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
            {[
              { title: 'Zero Clutter', desc: 'Removes popups and ads.' },
              { title: 'Smart Sync', desc: 'Syncs to your meal planner.' },
              { title: 'Auto Tagging', desc: 'Categorizes by AI analysis.' }
            ].map((feature, i) => (
              <Box key={i} sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>{feature.title}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{feature.desc}</Typography>
              </Box>
            ))}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ImporterPage;

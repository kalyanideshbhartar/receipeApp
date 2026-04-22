import { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Typography, CircularProgress 
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '../../services/recipe.service';
import { toast } from 'react-hot-toast';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface QuickCommentModalProps {
  open: boolean;
  onClose: () => void;
  recipeId: number;
  recipeTitle: string;
  authorName: string;
}

const QuickCommentModal = ({ open, onClose, recipeId, recipeTitle, authorName }: QuickCommentModalProps) => {
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: (text: string) => recipeService.addComment(recipeId, text),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('Your thought has been shared! ✨');
      onClose();
    },
    onError: () => toast.error('Failed to post comment. Please try again.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: '24px',
          padding: 1,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'primary.light', display: 'flex' }}>
          <ChatBubbleOutlineIcon sx={{ color: 'primary.main', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>Quick Thought</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>On {recipeTitle} by @{authorName}</Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            placeholder="What's on your mind? Share a quick secret or just some love..."
            variant="outlined"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={addCommentMutation.isPending}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                bgcolor: 'rgba(0,0,0,0.02)',
                '& fieldset': { borderColor: 'rgba(0,0,0,0.05)' },
                '&:hover fieldset': { borderColor: 'primary.light' }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={onClose} 
            sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained"
            endIcon={addCommentMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
            disabled={!commentText.trim() || addCommentMutation.isPending}
            sx={{ 
              borderRadius: '12px', 
              px: 3, 
              fontWeight: 900,
              textTransform: 'none',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
            }}
          >
            {addCommentMutation.isPending ? 'Sharing...' : 'Post Thought'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default QuickCommentModal;

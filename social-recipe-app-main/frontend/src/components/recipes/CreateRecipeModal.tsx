import { 
  Dialog, DialogContent, DialogTitle, 
  IconButton, Typography 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CreateRecipeForm from './CreateRecipeForm';
import { useModal } from '../../context/ModalContext';

const CreateRecipeModal: React.FC = () => {
  const { isCreateRecipeModalOpen, closeCreateRecipeModal } = useModal();

  return (
    <Dialog 
      open={isCreateRecipeModalOpen} 
      onClose={closeCreateRecipeModal}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 4,
          p: 1,
          bgcolor: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle component="div" sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>Share Your Recipe</Typography>
        <IconButton
          aria-label="close"
          onClick={closeCreateRecipeModal}
          sx={{ color: (theme) => theme.palette.grey[500] }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        <CreateRecipeForm 
          onSuccess={closeCreateRecipeModal} 
          onCancel={closeCreateRecipeModal} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateRecipeModal;

import { 
  Modal, Box, Typography, IconButton, 
  List, ListItem, ListItemAvatar, ListItemText, 
  Avatar, Button, CircularProgress 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import type { UserProfile } from '../../services/user.service';

interface UserListModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  users: UserProfile[];
  isLoading: boolean;
}

const UserListModal = ({ open, onClose, title, users, isLoading }: UserListModalProps) => {
  const navigate = useNavigate();

  const handleUserClick = (id: number) => {
    navigate(`/profile/${id}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="user-list-modal-title"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 400 },
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 24,
        p: 0,
        overflow: 'hidden',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(0,0,0,0.08)'
        }}>
          <Typography id="user-list-modal-title" variant="h6" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ overflowY: 'auto', p: 1, flexGrow: 1 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : users.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No users found.</Typography>
            </Box>
          ) : (
            <List>
              {users.map((user) => (
                <ListItem 
                  key={user.id} 
                  disablePadding
                  secondaryAction={
                    <Button 
                      variant="text" 
                      size="small" 
                      onClick={() => handleUserClick(user.id)}
                      sx={{ fontWeight: 700, textTransform: 'none' }}
                    >
                      View
                    </Button>
                  }
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 1.5, 
                      width: '100%', 
                      cursor: 'pointer',
                      borderRadius: 2,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
                    }}
                    onClick={() => handleUserClick(user.id)}
                  >
                    <ListItemAvatar>
                      <Avatar src={user.profilePictureUrl}>
                        {user.username[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {user.username}
                        </Typography>
                      }
                      secondary={user.bio ? (user.bio.length > 50 ? user.bio.substring(0, 50) + '...' : user.bio) : 'No bio'}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default UserListModal;

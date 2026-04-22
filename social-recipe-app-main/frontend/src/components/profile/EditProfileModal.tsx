import React, { useState } from 'react';
import { 
  Modal, Box, Typography, TextField, Button, 
  Avatar, IconButton, Stack, CircularProgress,
  InputAdornment, Popover // Added these
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon'; // Added this
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store/store';
import { updateProfileThunk } from '../../features/user/userThunks';
import type { UserProfile } from '../../services/user.service';
import { recipeService } from '../../services/recipe.service';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onClose, profile }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [bio, setBio] = useState(profile.bio || '');
  const [image, setImage] = useState(profile.profilePictureUrl || '');
  const [coverImage, setCoverImage] = useState(profile.coverPictureUrl || '');
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- EMOJI PICKER STATE ---
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleEmojiOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setAnchorEl(null);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setBio((prev) => prev + emojiData.emoji);
    // Optional: close after picking
    // setAnchorEl(null);
  };
  // --------------------------

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'avatar') setUploading(true);
    else setUploadingCover(true);

    try {
      const { signature, timestamp, apiKey, cloudName, folder } = await recipeService.getCloudinarySignature(type === 'avatar' ? 'profiles' : 'covers');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('api_key', apiKey);
      formData.append('folder', folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (type === 'avatar') setImage(data.secure_url);
      else setCoverImage(data.secure_url);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      if (type === 'avatar') setUploading(false);
      else setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(updateProfileThunk({ bio, profilePictureUrl: image, coverPictureUrl: coverImage }));
      onClose();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}
    >
      <Box sx={{ 
        width: { xs: '95%', sm: 500 }, 
        bgcolor: '#ffffff', 
        borderRadius: 2, 
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        outline: 'none',
        border: '1px solid rgba(0,0,0,0.05)',
        position: 'relative'
      }}>
        {/* Header/Cover Preview */}
        <Box sx={{ position: 'relative', height: 180, bgcolor: '#f1f5f9' }}>
          {coverImage ? (
            <Box component="img" src={coverImage} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box sx={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', opacity: 0.9 }} />
          )}
          
          <IconButton 
            component="label"
            sx={{ 
              position: 'absolute', top: 20, right: 20, 
              bgcolor: '#ffffff', 
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              '&:hover': { bgcolor: '#f8fafc', transform: 'scale(1.1)' },
              transition: 'all 0.3s ease'
            }}
          >
            <input hidden accept="image/*" type="file" onChange={(e) => handleImageUpload(e, 'cover')} />
            {uploadingCover ? <CircularProgress size={24} /> : <PhotoCameraIcon />}
          </IconButton>
          
          <IconButton 
            onClick={onClose} 
            sx={{ 
              position: 'absolute', top: 20, left: 20, 
              bgcolor: '#1e293b', 
              color: 'white', 
              '&:hover': { bgcolor: '#0f172a', transform: 'rotate(90deg)' },
              transition: 'all 0.3s ease'
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 4, pt: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: -8, mb: 4 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar 
                src={image} 
                sx={{ 
                  width: 110, 
                  height: 110, 
                  border: '4px solid white', 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem',
                  fontWeight: 900
                }}
              >
                {profile.username[0].toUpperCase()}
              </Avatar>
              <IconButton 
                component="label" 
                sx={{ 
                  position: 'absolute', bottom: 8, right: 8, 
                  bgcolor: 'primary.main', color: 'white',
                  '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.05)' },
                  boxShadow: '0 4px 12px rgba(44, 62, 80, 0.3)',
                  p: 1,
                  transition: 'all 0.3s ease'
                }}
                disabled={uploading}
              >
                <input hidden accept="image/*" type="file" onChange={(e) => handleImageUpload(e, 'avatar')} />
                {uploading ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Box>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 950, textAlign: 'center', mb: 0.5, letterSpacing: '-0.02em' }}>
            {profile.username}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mb: 4, fontWeight: 500 }}>
            Update your profile details
          </Typography>

          {/* BIO FIELD WITH EMOJI BUTTON */}
          <TextField
            fullWidth
            size="small"
            label="Professional Bio"
            multiline
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share your culinary journey..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                  <IconButton onClick={handleEmojiOpen} size="small">
                    <InsertEmoticonIcon sx={{ color: 'primary.main' }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ 
              mb: 4, 
              '& .MuiOutlinedInput-root': { 
                borderRadius: 1.5,
                bgcolor: '#f8fafc',
                fontWeight: 500,
                '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
              },
              '& .MuiInputLabel-root': { fontWeight: 700 }
            }}
          />

          {/* EMOJI POPOVER */}
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleEmojiClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
                sx: { borderRadius: 3, mt: 1, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }
            }}
          >
            <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                autoFocusSearch={false}
                theme={Theme.LIGHT}
                width={300}
                height={400}
            />
          </Popover>

          <Stack direction="row" spacing={3}>
            <Button 
              fullWidth 
              variant="text" 
              onClick={onClose}
              sx={{ 
                py: 1.2, 
                borderRadius: 1.5, 
                fontWeight: 800, 
                color: 'text.secondary',
                '&:hover': { bgcolor: '#f1f5f9', color: 'text.primary' }
              }}
            >
              Cancel
            </Button>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={handleSave}
              disabled={saving || uploading || uploadingCover}
              sx={{ 
                py: 1.2, 
                borderRadius: 1.5, 
                fontWeight: 900,
                boxShadow: '0 4px 12px rgba(44, 62, 80, 0.15)',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};

export default EditProfileModal;
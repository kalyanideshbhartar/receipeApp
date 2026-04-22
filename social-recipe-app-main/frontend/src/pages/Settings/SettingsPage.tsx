import { useState } from 'react';
import { 
  Container, Box, Paper, Typography, TextField, Button, 
  Avatar, Divider, Alert, CircularProgress
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    setPwError(null);
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: string } };
      setPwError(error.response?.data || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      await api.delete('/users/me');
      signOut();
      navigate('/login');
      toast.success('Account deleted');
    } catch {
      toast.error('Failed to delete account');
    }
  };

  return (
    <Box className="bg-mesh" sx={{ minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="sm">
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)} 
          sx={{ mb: 3, fontWeight: 800, textTransform: 'none', color: 'text.secondary' }}
        >
          Back
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: '-0.03em', mb: 4 }}>
          Settings
        </Typography>

        {/* Account Info Card */}
        <Paper className="glass-card" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1.5, display: 'flex' }}>
              <PersonIcon sx={{ color: 'primary.main' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Account Info</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={user?.profilePictureUrl} 
              sx={{ width: 56, height: 56, fontWeight: 900, bgcolor: 'primary.main' }}
            >
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{user?.username}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Change Password Card */}
        <Paper className="glass-card" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1.5, display: 'flex' }}>
              <LockIcon sx={{ color: 'primary.main' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Change Password</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {pwError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{pwError}</Alert>}

          <Box component="form" onSubmit={handleChangePassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              size="small"
              fullWidth
              type="password"
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <TextField
              size="small"
              fullWidth
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <TextField
              size="small"
              fullWidth
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              disabled={pwLoading}
              sx={{ borderRadius: 1.5, py: 1, fontWeight: 900, textTransform: 'none' }}
            >
              {pwLoading ? <CircularProgress size={22} color="inherit" /> : 'Update Password'}
            </Button>
          </Box>
        </Paper>

        {/* Danger Zone */}
        <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(244,63,94,0.2)', bgcolor: 'rgba(244,63,94,0.02)' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'error.main', mb: 1 }}>Danger Zone</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Permanently delete your account and all data. This action cannot be undone.
          </Typography>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleDeleteAccount}
            sx={{ borderRadius: 1.5, fontWeight: 900, textTransform: 'none' }}
          >
            Delete My Account
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default SettingsPage;

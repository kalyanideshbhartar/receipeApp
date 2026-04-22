import { useState } from 'react';
import { Container, Typography, TextField, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      toast.success('Password reset successful! Please login.');
      navigate('/login');
    } catch (err: unknown) {
      const error = err as { response?: { data?: string | { message?: string } } };
      const message = error.response?.data;
      const errorMessage = (typeof message === 'object' ? message?.message : message) || 'Failed to reset password';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 12 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Paper elevation={0} className="glass-card" sx={{ p: 6, borderRadius: '32px', border: '1px solid rgba(255,255,255,0.3)' }}>
          <Typography variant="h3" sx={{ fontWeight: 950, mb: 1, letterSpacing: '-0.04em' }}>Reset Password</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, fontWeight: 500 }}>
            Enter your 6-digit OTP and new password.
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="6-Digit OTP"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              sx={{ mb: 4 }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ py: 2, borderRadius: '16px', fontWeight: 900, fontSize: '1.1rem' }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default ResetPasswordPage;

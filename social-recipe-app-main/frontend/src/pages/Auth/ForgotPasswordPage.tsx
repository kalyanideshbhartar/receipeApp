import { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Paper, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      toast.success('Reset email sent!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: string | { message?: string } } };
      const message = error.response?.data;
      const errorMessage = (typeof message === 'object' ? message?.message : message) || 'Failed to send reset email';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 12 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Paper elevation={0} className="glass-card" sx={{ p: 6, borderRadius: '32px', border: '1px solid rgba(255,255,255,0.3)' }}>
          <Typography variant="h3" sx={{ fontWeight: 950, mb: 1, letterSpacing: '-0.04em' }}>Forgot Password?</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, fontWeight: 500 }}>
            Enter your email and we'll send you a 6-digit OTP.
          </Typography>

          {success ? (
            <Box>
              <Alert severity="success" sx={{ mb: 4, borderRadius: '16px' }}>
                If an account exists for {email}, you will receive a 6-digit OTP shortly.
              </Alert>
              <Button fullWidth onClick={() => navigate('/reset-password')} variant="contained">
                Enter OTP
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
};

export default ForgotPasswordPage;

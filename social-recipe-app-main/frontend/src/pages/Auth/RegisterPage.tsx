import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, 
  CircularProgress, InputAdornment, IconButton, Grid
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import type { AppDispatch } from '../../store/store';
import { registerThunk } from '../../features/auth/authThunks';
import { useAuth } from '../../hooks/useAuth';
import { clearError } from '../../features/auth/authSlice';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface RegisterFormValues {
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>();

  useEffect(() => {
    if (isAuthenticated) navigate('/feed', { replace: true });
    return () => { dispatch(clearError()); };
  }, [isAuthenticated, navigate, dispatch]);

  const onSubmit = (data: RegisterFormValues) => {
    dispatch(registerThunk({ 
      username: data.username, 
      fullName: data.fullName,
      email: data.email, 
      password: data.password 
    }));
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'white' }}>
      {/* Left Side: Form */}
      <Box 
        sx={{ 
          flex: { xs: 1, md: 0.55, lg: 0.5 }, 
          display: 'flex', 
          flexDirection: 'column',
          p: { xs: 4, md: 5, lg: 6 },
          position: 'relative',
          justifyContent: 'center',
          overflowY: 'auto'
        }}
      >
        <Box sx={{ maxWidth: 500, width: '100%', mx: 'auto' }}>
          <Box 
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: { xs: 3, md: 4 } }}
            onClick={() => navigate('/feed')}
          >
            <Box sx={{ bgcolor: 'primary.main', p: 1, borderRadius: 2, display: 'flex', mr: 1.5 }}>
              <RestaurantMenuIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', letterSpacing: '-0.04em' }}>
              Culinario
            </Typography>
          </Box>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
          <Typography variant="h3" sx={{ fontWeight: 950, mb: 1.5, letterSpacing: '-0.03em' }}>
            Join our community
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: { xs: 4, md: 5 }, fontWeight: 500 }}>
            Start sharing and discovering amazing recipes today.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>Full Name</Typography>
                  <TextField
                    fullWidth
                    placeholder="John Doe"
                    {...register('fullName', { 
                      required: 'Full Name is required',
                      maxLength: { value: 100, message: 'Full Name cannot exceed 100 characters' }
                    })}
                    error={!!errors.fullName}
                    helperText={errors.fullName?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.02)' } }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>Username</Typography>
                  <TextField
                    fullWidth
                    placeholder="Chef_Explorer"
                    {...register('username', { 
                      required: 'Username is required', 
                      minLength: { value: 3, message: 'Username must be at least 3 characters' },
                      maxLength: { value: 20, message: 'Username cannot exceed 20 characters' },
                      pattern: { value: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: 'Must start with a letter (A-Z)' }
                    })}
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.02)' } }}
                  />
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>Email Address</Typography>
                  <TextField
                    fullWidth
                    placeholder="you@example.com"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
                    })}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.02)' } }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>Password</Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password', { 
                      required: 'Password is required', 
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      pattern: { 
                        value: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
                        message: 'Requires uppercase, number, and special char'
                      }
                    })}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.02)' } }}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>Confirm</Typography>
                  <TextField
                    fullWidth
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: val => val === watch('password') || 'Passwords do not match'
                    })}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.02)' } }}
                  />
                </Box>
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 4,
                py: 2, 
                borderRadius: 3, 
                textTransform: 'none', 
                fontWeight: 900, 
                fontSize: '1.1rem',
                boxShadow: '0 12px 24px rgba(99, 102, 241, 0.25)',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 16px 32px rgba(99, 102, 241, 0.3)' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 800 }}>
                Sign in instead
              </Link>
            </Typography>
          </Box>
          </motion.div>

        </Box>
      </Box>

      {/* Right Side: Image */}
      <Box 
        sx={{ 
          flex: { xs: 0, md: 0.45, lg: 0.5 },
          display: { xs: 'none', md: 'block' },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box 
          component="img"
          src="/culinary_auth_bg.png"
          sx={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover'
          }}
        />
        <Box 
          sx={{ 
            position: 'absolute', 
            inset: 0, 
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(139, 92, 246, 0.4) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: 6,
            color: 'white'
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em' }}>
            "Good food is the foundation of genuine happiness."
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.8, fontWeight: 600 }}>
            — Auguste Escoffier
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;

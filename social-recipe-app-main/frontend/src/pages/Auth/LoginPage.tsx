import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, 
  CircularProgress, IconButton, InputAdornment
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import type { AppDispatch } from '../../store/store';
import { loginThunk } from '../../features/auth/authThunks';
import { useAuth } from '../../hooks/useAuth';
import { clearError } from '../../features/auth/authSlice';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LoginFormValues {
  username: string;
  password: string;
}

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();

  useEffect(() => {
    if (isAuthenticated) navigate('/feed', { replace: true });
    return () => { dispatch(clearError()); };
  }, [isAuthenticated, navigate, dispatch]);

  const onSubmit = (data: LoginFormValues) => {
    dispatch(loginThunk(data));
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'white' }}>
      {/* Left Side: Form */}
      <Box 
        sx={{ 
          flex: { xs: 1, md: 0.5, lg: 0.45 }, 
          display: 'flex', 
          flexDirection: 'column',
          p: { xs: 4, md: 6, lg: 8 },
          position: 'relative',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ maxWidth: 450, width: '100%', mx: 'auto' }}>
          <Box 
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 6 }}
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
            Welcome back
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 6, fontWeight: 500 }}>
            Sign in to continue your culinary journey.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800, color: 'text.primary' }}>Username or Email</Typography>
              <TextField
                fullWidth
                placeholder="Username or Email"
                {...register('username', { required: 'Username or Email is required' })}
                error={!!errors.username}
                helperText={errors.username?.message}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 3,
                    bgcolor: 'rgba(0,0,0,0.02)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                  } 
                }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>Password</Typography>
                <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: '#6366f1', textDecoration: 'none', fontWeight: 700 }}>
                  Forgot password?
                </Link>
              </Box>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
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
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 3,
                    bgcolor: 'rgba(0,0,0,0.02)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                  } 
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                py: 2, 
                borderRadius: 3, 
                textTransform: 'none', 
                fontWeight: 900, 
                fontSize: '1.1rem',
                boxShadow: '0 12px 24px rgba(99, 102, 241, 0.25)',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 16px 32px rgba(99, 102, 241, 0.3)' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 800 }}>
                Get started for free
              </Link>
            </Typography>
          </Box>
          </motion.div>

        </Box>
      </Box>

      {/* Right Side: Image */}
      <Box 
        sx={{ 
          flex: { xs: 0, md: 0.5, lg: 0.55 },
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
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: 6,
            color: 'white'
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em' }}>
            "Cooking is an art, but all art requires knowing something about the techniques and materials."
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.8, fontWeight: 600 }}>
            — Nathan Myhrvold
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;

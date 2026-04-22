import { createTheme, type Shadows } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2C3E50', // Midnight Slate
      light: '#34495E',
      dark: '#1A252F',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#E67E22', // Ember Orange
      light: '#EB984E',
      dark: '#D35400',
      contrastText: '#ffffff',
    },
    success: {
      main: '#27AE60',
      light: '#2ECC71',
      dark: '#1E8449',
    },
    background: {
      default: '#F8F9FA',
      paper: '#ffffff',
    },
    text: {
      primary: '#2C3E50',
      secondary: '#7F8C8D',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em', color: '#2C3E50' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em', color: '#2C3E50' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600, color: '#7F8C8D' },
    body1: { lineHeight: 1.7, fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.02)',
    '0 4px 6px rgba(0,0,0,0.04)',
    '0 10px 15px rgba(0,0,0,0.05)',
    '0 20px 25px rgba(0,0,0,0.06)',
    '0 25px 50px rgba(0,0,0,0.1)',
    '0 4px 20px rgba(44, 62, 80, 0.05)', // Specialized soft shadow
    ...Array(18).fill('none'),
  ] as Shadows,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '12px 28px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transform: 'translateY(-1px)',
          },
        },
        containedPrimary: {
          backgroundColor: '#2C3E50',
          '&:hover': {
            backgroundColor: '#34495E',
          },
        },
        containedSecondary: {
          backgroundColor: '#E67E22',
          '&:hover': {
            backgroundColor: '#D35400',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: '1px solid #EAECEE',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
            borderColor: '#D5D8DC',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#2C3E50',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderBottom: '1px solid #F2F3F4',
        },
      },
    },
  },
});

export default theme;

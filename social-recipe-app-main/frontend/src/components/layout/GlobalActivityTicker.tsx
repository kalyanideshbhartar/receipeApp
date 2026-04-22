import { Box, Typography, Slide } from '@mui/material';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../hooks/useAuth';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const GlobalActivityTicker = () => {
    const { latestActivity } = useWebSocket();
    const { user } = useAuth();

    if (!latestActivity || user?.roles?.includes('ROLE_ADMIN')) return null;

    return (
        <Box 
            sx={{ 
                position: 'fixed', 
                top: 80, 
                left: '50%', 
                transform: 'translateX(-50%)', 
                zIndex: 1100, 
                pointerEvents: 'none',
                width: 'auto',
                display: 'flex',
                justifyContent: 'center'
            }}
        >
            <Slide direction="down" in={!!latestActivity} mountOnEnter unmountOnExit>
                <Box 
                    sx={{ 
                        bgcolor: 'rgba(0,0,0,0.85)', 
                        color: 'white', 
                        px: 3, 
                        py: 1, 
                        borderRadius: '40px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <AutoAwesomeIcon sx={{ color: '#FFD700', fontSize: 18 }} />
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontWeight: 700, 
                            fontSize: '0.85rem',
                            letterSpacing: '0.02em',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {latestActivity}
                    </Typography>
                </Box>
            </Slide>
        </Box>
    );
};

export default GlobalActivityTicker;

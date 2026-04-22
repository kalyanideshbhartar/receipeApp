import { useState } from 'react';
import { 
  Container, Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Avatar, Chip, IconButton,
  CircularProgress, Grid, Card, CardContent, Tooltip,
  Tabs, Tab,
  Button
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PeopleIcon from '@mui/icons-material/People';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';

import BlockIcon from '@mui/icons-material/Block';

interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  isVerified: boolean;
  isRestricted: boolean; 
  premium: boolean; // Renamed
  profilePictureUrl: string;
  reputationPoints: number;
}

interface AuditLog {
  id: number;
  action: string;
  performedBy: string;
  target: string;
  details: string;
  timestamp: string;
}



const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);

  
  const [premiumOverrideOpen, setPremiumOverrideOpen] = useState(false);
  const [selectedUserForPremium, setSelectedUserForPremium] = useState<string | null>(null);
  const [premiumDuration, setPremiumDuration] = useState(30);

  // --- Data Fetching ---
  const { 
    data: users = [], 
    isLoading: isUsersLoading 
  } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<User[]>('/admin/users').then(res => res.data),
  });



  const { 
    data: stats = { totalUsers: 0 }, 
    isLoading: isStatsLoading 
  } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<{ totalUsers: number }>('/admin/stats').then(res => ({
      totalUsers: res.data.totalUsers || 0,
    })),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: () => api.get<AuditLog[]>('/admin/audit-logs').then(res => res.data),
    enabled: tabValue === 1
  });

  // --- Mutations ---




  const toggleRestrictUserMutation = useMutation({
    mutationFn: (username: string) => api.patch(`/admin/users/${username}/restrict`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User restriction toggled');
    },
  });

  


  const premiumOverrideMutation = useMutation({
    mutationFn: ({ username, isPremium, durationDays }: { username: string, isPremium: boolean, durationDays?: number }) => 
      api.patch(`/admin/users/${username}/premium-override`, { isPremium, durationDays }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Premium status overridden');
      setPremiumOverrideOpen(false);
    },
    onError: () => toast.error('Failed to override premium'),
  });

  const isLoading = isUsersLoading || isStatsLoading;

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  return (
    <Box className="bg-mesh" sx={{ minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: '-0.03em', mb: 4 }}>
          Platform Management
        </Typography>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12 }}>
            <Card className="glass-card" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, bgcolor: 'primary.light', borderRadius: 1.5, display: 'flex' }}>
                  <PeopleIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 950 }}>{stats.totalUsers}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>TOTAL USERS</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ '& .MuiTab-root': { fontWeight: 900 } }}>
            <Tab icon={<PeopleIcon />} label="User Management" />
            <Tab icon={<HistoryIcon />} label="Audit Logs" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Paper className="glass-card" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>User Management</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Roles</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Premium</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Reputation</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={user.profilePictureUrl} sx={{ width: 40, height: 40, fontWeight: 900 }}>
                          {user.username[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                            {user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.roles.map((role) => (
                          <Chip 
                            key={role} 
                            label={role.replace('ROLE_', '')} 
                            size="small" 
                            color={role === 'ROLE_ADMIN' ? 'secondary' : 'default'}
                            variant={role === 'ROLE_ADMIN' ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 800, fontSize: '0.65rem' }} 
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {user.premium ? (
                        <Chip 
                          label="Premium" 
                          size="small" 
                          icon={<WorkspacePremiumIcon sx={{ fontSize: '14px !important', color: '#B8860B !important' }} />}
                          sx={{ fontWeight: 900, bgcolor: 'rgba(255, 215, 0, 0.2)', color: '#B8860B', border: '1px solid #FFD700' }} 
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 700 }}>Basic</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{user.reputationPoints} pts</TableCell>
                    <TableCell align="right">
                      <Tooltip title={user.isRestricted ? "Unrestrict User" : "Restrict User"}>
                        <IconButton onClick={() => toggleRestrictUserMutation.mutate(user.username)} color="warning">
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Premium Override">
                        <IconButton 
                          onClick={() => {
                            setSelectedUserForPremium(user.username);
                            setPremiumOverrideOpen(true);
                          }} 
                          sx={{ color: '#B8860B' }}
                        >
                          <WorkspacePremiumIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        )}

        {tabValue === 1 && (
          /* Audit Logs Table */
          <Paper className="glass-card" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 900 }}>Administrative Audit Logs</Typography>
            </Box>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Performed By</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Target</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Details</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Chip 
                          label={log.action} 
                          size="small" 
                          color={log.action === 'MERGE_USERS' ? 'secondary' : 'primary'}
                          sx={{ fontWeight: 900, fontSize: '0.65rem' }} 
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{log.performedBy}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.target}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem' }}>{log.details}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {auditLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No audit logs yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Container>

      {/* --- Dialogs --- */}
      


      {/* Premium Override Dialog */}
      <Dialog open={premiumOverrideOpen} onClose={() => setPremiumOverrideOpen(false)}>
        <DialogTitle sx={{ fontWeight: 900 }}>Premium Override: {selectedUserForPremium}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Premium Status</InputLabel>
              <Select
                value={30} // Dummy
                label="Premium Status"
                onChange={() => {}}
              >
                <MenuItem value={30}>Add 30 Days</MenuItem>
                <MenuItem value={90}>Add 90 Days</MenuItem>
                <MenuItem value={365}>Add 1 Year</MenuItem>
                <MenuItem value={0}>Remove Premium</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              label="Custom Days" 
              type="number" 
              value={premiumDuration} 
              onChange={(e) => setPremiumDuration(parseInt(e.target.value))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPremiumOverrideOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => premiumOverrideMutation.mutate({ 
              username: selectedUserForPremium!, 
              isPremium: premiumDuration > 0,
              durationDays: premiumDuration > 0 ? premiumDuration : undefined
            })}
            sx={{ fontWeight: 900 }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;

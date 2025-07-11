import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import Badge from '@mui/material/Badge';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import { useNavigate, useLocation } from 'react-router-dom';
import MswdoLogo from '../assets/MSWDO LOGO.png';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Define API base URL from environment variables with fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    minWidth: 0,
    backgroundColor: 'white',
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backgroundColor: '#ffffff',
  color: '#000000',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const LogoContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
}));

const navigationItems = [
  {
    title: 'Dashboard',
    path: '/adminpage',
    icon: <DashboardIcon />
  },
  {
    title: 'Applications',
    path: '/adminpage/adminapplications',
    icon: <AssignmentIcon />
  },
  {
    title: 'Solo Parent Management',
    path: '/adminpage/soloparents',
    icon: <ShoppingCartIcon />
  },
  {
    title: 'New Child Requests',
    path: '/adminpage/newchildrequests',
    icon: <AssignmentIcon />
  }
];

export default function Layout({ children }) {
  const [open, setOpen] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = React.useState([]);
  const [notifLoading, setNotifLoading] = React.useState(false);
  const [notifError, setNotifError] = React.useState("");
  const [showNotifModal, setShowNotifModal] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openMenu = Boolean(anchorEl);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState('');
  const [passwordSuccess, setPasswordSuccess] = React.useState('');
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  // Fetch notifications for the logged-in admin's barangay
  const fetchNotifications = async () => {
    const barangay = localStorage.getItem('barangay');
    if (!barangay) return;
    
    setNotifLoading(true);
    setNotifError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/adminnotifications?barangay=${encodeURIComponent(barangay)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        // Normalize notification objects for UI
        const normalized = data.notifications.map(n => ({
          id: n.id,
          user_id: n.user_id,
          notif_type: n.notif_type,
          message: n.message,
          is_read: n.is_read === 1 || n.is_read === true,
          created_at: n.created_at,
          date: n.created_at ? n.created_at.split('T')[0] : ''
        }));
        // Sort by created_at desc
        normalized.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setNotifications(normalized);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
      setNotifError("Failed to load notifications");
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  // Fetch notifications when component mounts and when modal opens
  React.useEffect(() => {
    fetchNotifications();
  }, []);

  React.useEffect(() => {
    if (showNotifModal) {
      fetchNotifications();
    }
  }, [showNotifModal]);

  // Mark notification as read
  const markAsRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    try {
      await fetch(`${API_BASE_URL}/api/adminnotifications/mark-as-read/${notifId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Handle notification click: mark as read, navigate, and close modal
  const handleNotifClick = notif => {
    markAsRead(notif.id);
    if (notif.notif_type === 'new_solo_parent') {
      navigate('/adminpage/soloparents');
    } else if (notif.notif_type === 'new_app') {
      navigate('/adminpage/adminapplications');
    } else if (notif.notif_type === 'new_child_request') {
      navigate('/adminpage/newchildrequests');
    }
    setShowNotifModal(false);
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    const barangay = localStorage.getItem('barangay');
    if (!barangay) return;
    
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/adminnotifications?barangay=${encodeURIComponent(barangay)}`, {
        method: 'DELETE'
      });
      setNotifications([]);
    } catch (err) {
      alert('Failed to clear notifications');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.is_read).map(n =>
          fetch(`${API_BASE_URL}/api/adminnotifications/mark-as-read/${n.id}`, {method: 'PUT'})
        )
      );
      setNotifications(notifications.map(n => ({...n, is_read: true})));
    } catch (err) {
      alert('Failed to mark all as read');
    }
  };

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    handleMenuClose();
  };

  const submitChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 10 || newPassword.length > 15) {
      setPasswordError('Password must be between 10 and 15 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from your current password');
      return;
    }

    try {
      setIsChangingPassword(true);
      const adminId = localStorage.getItem('id');
      if (!adminId) {
        setPasswordError('Admin not authenticated');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/admins/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId,
          currentPassword,
          newPassword
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setPasswordSuccess('Password changed successfully');
        setTimeout(() => {
          setShowChangePasswordModal(false);
        }, 2000);
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('An error occurred. Please try again. ' + (error.message || ''));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    // Remove all user/admin/superadmin tokens, IDs, emails, and cached data
    const keysToRemove = [
      'superadminToken', 'superadminId', 'superadminEmail',
      'userToken', 'UserId', 'UserEmail', 'UserName', 'UserRole', 'token',
      'id', 'barangay', 'loggedInUser',
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    // Remove any cached profile pictures or app-specific data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('profilePic_') || key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
    // Redirect to main page
    window.location.href = '/mainpage';
  };

  React.useEffect(() => {
    // Ensure body doesn't scroll horizontally, especially when modals/drawers are open
    document.body.style.overflowX = 'hidden';

    // Cleanup function to reset the style when the component unmounts
    return () => {
      document.body.style.overflowX = '';
    };
  }, []); // Run once on mount and cleanup on unmount

  return (
    <Box sx={{
      display: 'flex',
      overflowX: 'hidden'
    }}>
      <AppBarStyled position="fixed" open={open}>
        <Toolbar sx={{
          flexShrink: 0 // Ensure Toolbar doesn't shrink and cause overflow
        }}>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{
              mr: { xs: 1, sm: 2 }, // Responsive margin
              padding: { xs: 0.5, sm: 1 }, // Responsive padding
              color: '#000000' // Changed color
            }}
          >
            <MenuIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{
            flexGrow: 1,
            overflow: 'hidden',       // Hide overflowing content
            textOverflow: 'ellipsis',  // Show ellipsis for truncated text
            fontSize: { xs: '0.875rem', sm: '1.25rem' }, // Responsive font size
            lineHeight: 1.2, // Tighter line height
            color: '#000000', // Changed color
            fontWeight: 600 // Added font weight
          }}>
            Admin Dashboard - {localStorage.getItem("barangay") || "Loading..."}
          </Typography>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1 }, // Responsive gap
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}>
            <IconButton 
              onClick={() => setShowNotifModal(true)}
              size="small"
              sx={{
                color: '#000000', // Changed color
                padding: { xs: 0.5, sm: 1 }, // Responsive padding
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)' // Changed background color
                }
              }}
            >
              <Badge badgeContent={notifications.filter(n => !n.is_read).length} color="error">
                <NotificationsIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
              </Badge>
            </IconButton>
            <IconButton
              onClick={handleMenuClick}
              size="small"
              sx={{
                color: '#000000',
                padding: { xs: 0.5, sm: 1 },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <SettingsIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: 1.5,
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5,
                  }
                }
              }}
            >
              <MenuItem onClick={handleChangePassword}>
                <ListItemIcon>
                  <LockIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Change Password</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => setShowLogoutModal(true)}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBarStyled>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#16C47F',
            color: '#1b5e20',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          {/* Removed the arrow button to save space */}
        </DrawerHeader>
        <LogoContainer>
          <img 
            src={MswdoLogo}
            alt="MSWDO Logo" 
            style={{ 
              width: '170px', 
              height: 'auto',
              marginBottom: '8px'
            }} 
          />
        </LogoContainer>
        <Divider sx={{ backgroundColor: '#ffffff' }} />
        <List>
          {navigationItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton 
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(27, 94, 32, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(27, 94, 32, 0.15)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(27, 94, 32, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#ffffff', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.title} 
                  sx={{ 
                    '& .MuiTypography-root': { 
                      color: '#ffffff',
                      fontWeight: location.pathname === item.path ? 600 : 400
                    } 
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        {children}
      </Main>

      {/* Notification Modal */}
      <Dialog
        open={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh',
            width: { xs: '95%', sm: '100%' } // Ensure modal doesn't take full width on very small screens if it's too wide
          }
        }}
      >
        <DialogTitle sx={{
          backgroundColor: '#16C47F',
          color: 'white',
          fontWeight: 600,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' }, // Stack on small screens
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' }, // Align items appropriately
          gap: { xs: 1, sm: 0 }, // Gap between stacked elements
          p: { xs: 2, sm: 3 } // Responsive padding
        }}>
          <Typography component="span" sx={{
            fontSize: { xs: '1rem', sm: '1.25rem' }, // Responsive font size
            fontWeight: 600,
            flexShrink: 1,
            minWidth: 0
          }}>Notifications</Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 0.5, sm: 1 },
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            minWidth: 0 // Allow content to shrink
          }}>
            <Button
              size="small"
              variant="outlined"
              onClick={markAllAsRead}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Mark all as read
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={clearAllNotifications}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Clear all
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {notifLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <Typography>Loading notifications...</Typography>
            </Box>
          ) : notifError ? (
            <Box sx={{ p: 3 }}>
              <Typography color="error">{notifError}</Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">No notifications available.</Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification) => (
                <ListItemButton
                  key={notification.id}
                  onClick={() => handleNotifClick(notification)}
                  sx={{
                    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                    backgroundColor: notification.is_read ? 'transparent' : 'rgba(22, 196, 127, 0.05)',
                    '&:hover': {
                      backgroundColor: notification.is_read ? 'rgba(0, 0, 0, 0.04)' : 'rgba(22, 196, 127, 0.1)'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{
                      bgcolor: notification.is_read ? 'grey.400' : '#16C47F',
                      width: 32,
                      height: 32
                    }}>
                      <NotificationsIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: notification.is_read ? 400 : 600,
                            color: notification.is_read ? 'text.secondary' : 'text.primary',
                            wordBreak: 'break-word'
                          }}
                        >
                          {notification.message}
                        </Typography>
                        {!notification.is_read && (
                          <Chip
                            label="New"
                            size="small"
                            sx={{
                              bgcolor: '#16C47F',
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {notification.date}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowNotifModal(false)}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              color: '#16C47F',
              '&:hover': {
                backgroundColor: 'rgba(22, 196, 127, 0.1)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onClose={() => setShowLogoutModal(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to log out?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogoutModal(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={showChangePasswordModal} onClose={() => setShowChangePasswordModal(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>
          )}
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>
          )}
          <form onSubmit={submitChangePassword}>
            <TextField
              label="Current Password"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                      {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
              helperText="Password must be between 10-15 characters"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
              <Button onClick={() => setShowChangePasswordModal(false)} variant="outlined" sx={{ borderRadius: 2, px: 3, textTransform: 'none', borderColor: '#16C47F', color: '#16C47F', '&:hover': { borderColor: '#16C47F', backgroundColor: 'rgba(22, 196, 127, 0.1)' } }}>Cancel</Button>
              <Button type="submit" disabled={isChangingPassword} sx={{ borderRadius: 2, px: 3, textTransform: 'none', backgroundColor: '#16C47F', color: 'white', '&:hover': { backgroundColor: '#14a06b' }, '&:disabled': { backgroundColor: '#ccc' } }}>{isChangingPassword ? 'Changing Password...' : 'Change Password'}</Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
} 
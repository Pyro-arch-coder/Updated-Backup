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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventIcon from '@mui/icons-material/Event';
import ForumIcon from '@mui/icons-material/Forum';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import LockIcon from '@mui/icons-material/Lock';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
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
    path: '/superadminpage',
    icon: <DashboardIcon />
  },
  {
    title: 'Admin Management',
    path: '/superadminpage/admins',
    icon: <AdminPanelSettingsIcon />
  },
  {
    title: 'Application',
    path: '/superadminpage/applications',
    icon: <AssignmentIcon />
  },
  {
    title: 'Announcement',
    path: '/superadminpage/announcements',
    icon: <CampaignIcon />
  },
  {
    title: 'Event Management',
    path: '/superadminpage/events',
    icon: <EventIcon />
  },
  {
    title: 'Forum Management',
    path: '/superadminpage/forums',
    icon: <ForumIcon />
  },
  {
    title: 'Solo Parent Management',
    path: '/superadminpage/soloparents',
    icon: <PeopleIcon />
  }
];

export default function SuperAdminLayout({ children }) {
  const [open, setOpen] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = React.useState([]);
  const [notifLoading, setNotifLoading] = React.useState(false);
  const [notifError, setNotifError] = React.useState("");
  const [showNotifModal, setShowNotifModal] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const openMenu = Boolean(anchorEl);

  // Function to fetch notifications
  const fetchNotifications = async () => {
    setNotifLoading(true);
    setNotifError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`);
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      // Expect { success, notifications: [...] }
      const notificationsArr = Array.isArray(data.notifications) ? data.notifications : [];
      const normalized = notificationsArr.map(n => ({
        id: n.id,
        user_id: n.user_id,
        notif_type: n.notif_type,
        message: n.message,
        is_read: n.is_read === 1 || n.is_read === true, // handle 0/1 or boolean
        created_at: n.created_at,
        date: n.created_at ? n.created_at.split('T')[0] : ''
      }));
      // Sort by created_at desc
      normalized.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(normalized);
    } catch (err) {
      setNotifError("Failed to load notifications");
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  };

  // Fetch notifications when component mounts and every 30 seconds
  React.useEffect(() => {
    fetchNotifications(); // Initial fetch on mount
    
    // Set up periodic fetching every 30 seconds
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Refetch notifications when modal opens for real-time refresh
  React.useEffect(() => {
    if (showNotifModal) {
      fetchNotifications();
    }
  }, [showNotifModal]);

  // Mark notification as read
  const markAsRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    // Optionally, update backend if endpoint exists
    try {
      await fetch(`${API_BASE_URL}/api/notifications/mark-as-read/${notifId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      // Ignore backend error for now, UI stays responsive
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'DELETE',
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
          fetch(`${API_BASE_URL}/api/notifications/mark-as-read/${n.id}`, {method: 'PUT'})
        )
      );
      setNotifications(notifications.map(n => ({...n, is_read: true})));
    } catch (err) {
      alert('Failed to mark all as read');
    }
  };

  // Handle notification click: mark as read and navigate
  const handleNotifClick = notif => {
    markAsRead(notif.id);
    if (notif.notif_type === "remarks") {
      navigate("/superadminpage/soloparents");
    } else if (notif.notif_type === "new_app") {
      navigate("/superadminpage/applications?tab=regular");
    } else if (notif.notif_type === "follow_up_doc") {
      navigate("/superadminpage/applications?tab=follow_up");
    }
    setShowNotifModal(false);
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

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('superadminToken');
    // Redirect to login page
    window.location.href = '/';
  };

  const handleChangePassword = () => {
    // Add change password logic here
    handleMenuClose();
    // Navigate to change password page or open modal
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
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{
              flexGrow: 1,
              overflow: 'hidden',       // Hide overflowing content
              textOverflow: 'ellipsis',  // Show ellipsis for truncated text
              fontSize: { xs: '0.875rem', sm: '1.25rem' }, // Responsive font size
              lineHeight: 1.2, // Tighter line height
              color: '#000000', // Changed color
              fontWeight: 600 // Added font weight
            }}
          >
            SANTA MARIA OFFICERS DASHBOARD
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
                color: '#000000', // Changed color
                padding: { xs: 0.5, sm: 1 }, // Responsive padding
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)' // Changed background color
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
              <MenuItem onClick={handleLogout}>
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
    </Box>
  );
} 
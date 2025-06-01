import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Tabs,
  Tab,
  Box,
  IconButton,
} from '@mui/material';
import { VideoCall as VideoCallIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getTabValue = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 0;
    if (path === '/chat') return 1;
    if (path === '/expert-feedback') return 2;
    return false;
  };

  if (!user) return null;

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          DanceAI
        </Typography>
        {user && (
          <>
            <Tabs
              value={getTabValue()}
              onChange={(e, newValue) => {
                switch (newValue) {
                  case 0:
                    navigate('/dashboard');
                    break;
                  case 1:
                    navigate('/chat');
                    break;
                  case 2:
                    navigate('/expert-feedback');
                    break;
                  default:
                    break;
                }
              }}
              textColor="inherit"
              indicatorColor="secondary"
            >
              <Tab label={user.role === 'instructor' ? 'Instructor Dashboard' : 'Performer Dashboard'} />
              <Tab label="Chat" />
              <Tab label="Expert Feedback" />
            </Tabs>
            <IconButton 
              color="inherit" 
              onClick={() => navigate('/balletCamera')}
              sx={{ ml: 2 }}
            >
              <VideoCallIcon />
            </IconButton>
            <Box sx={{ ml: 2 }}>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation; 
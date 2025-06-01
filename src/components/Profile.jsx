import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { Typography, Button, Box } from '@mui/material';

const Profile = ({ user, setUser }) => {
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    alert('You have been logged out.');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 4,
        backgroundColor: '#f9f9f9',
        borderRadius: 3,
        boxShadow: 3,
      }}
    >
      <Typography variant="h4" sx={{ mb: 2 }}>
        Welcome, {user.email}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        sx={{ mt: 2 }}
        onClick={handleLogout}
      >
        Logout
      </Button>
    </Box>
  );
};

export default Profile;

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Fade,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FavoriteIcon from '@mui/icons-material/Favorite';

const Login = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('performer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login, register, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, {
        name,
        role,
        genre: 'Ballet', // Default value
        skill_level: 'Beginner', // Default value
        techniques_to_improve: [] // Default value
      });
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      bgcolor: '#FDF2F8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 10
    }}>
      <Fade in timeout={700}>
        <Paper elevation={6} sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 5,
          boxShadow: '0 8px 32px rgba(255, 20, 147, 0.10)',
          background: '#fff',
          minWidth: { xs: '90vw', sm: 420 },
          maxWidth: 440,
          mx: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}>
          <Avatar sx={{ bgcolor: '#FFB6D5', width: 64, height: 64, mb: 1 }}>
            <FavoriteIcon sx={{ color: '#FF1493', fontSize: 38 }} />
          </Avatar>
          <Typography variant="h3" align="center" gutterBottom sx={{ color: '#FF1493', fontWeight: 800, letterSpacing: 1, mb: 1, fontSize: { xs: '2rem', sm: '2.5rem' } }}>
            Dance AI
          </Typography>
          <Typography variant="subtitle1" align="center" sx={{ color: '#7C3A58', mb: 2, fontWeight: 500 }}>
            Welcome! Sign in or create your account
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, width: '100%' }}>
            <Tabs value={activeTab} onChange={handleTabChange} centered sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1.1rem',
                color: '#7C3A58',
                borderRadius: 2,
                transition: 'background 0.2s',
                '&.Mui-selected': {
                  color: '#FF1493',
                  background: 'rgba(255, 20, 147, 0.08)'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#FF1493',
                height: 3,
                borderRadius: 2
              }
            }}>
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%', borderRadius: 2, fontWeight: 500 }}>{error}</Alert>
          )}

          {activeTab === 0 ? (
            <Box component="form" onSubmit={handleLogin} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  background: '#FFF0F5',
                  boxShadow: '0 2px 8px rgba(255, 20, 147, 0.04)',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    background: '#FFF0F5',
                    '& fieldset': {
                      borderColor: 'rgba(255, 20, 147, 0.18)'
                    },
                    '&:hover fieldset': {
                      borderColor: '#FFB6D5'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF1493',
                      boxShadow: '0 0 0 2px rgba(255, 20, 147, 0.12)'
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  background: '#FFF0F5',
                  boxShadow: '0 2px 8px rgba(255, 20, 147, 0.04)',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    background: '#FFF0F5',
                    '& fieldset': {
                      borderColor: 'rgba(255, 20, 147, 0.18)'
                    },
                    '&:hover fieldset': {
                      borderColor: '#FFB6D5'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF1493',
                      boxShadow: '0 0 0 2px rgba(255, 20, 147, 0.12)'
                    }
                  }
                }}
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{
                  mt: 1,
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #FFB6D5 0%, #FF1493 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 16px rgba(255, 20, 147, 0.10)',
                  py: 1.2,
                  '&:hover': {
                    background: 'linear-gradient(90deg, #FF1493 0%, #FFB6D5 100%)',
                    opacity: 0.95
                  }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Login'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleRegister} sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  background: '#FFF0F5',
                  boxShadow: '0 2px 8px rgba(255, 20, 147, 0.04)',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    background: '#FFF0F5',
                    '& fieldset': {
                      borderColor: 'rgba(255, 20, 147, 0.18)'
                    },
                    '&:hover fieldset': {
                      borderColor: '#FFB6D5'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF1493',
                      boxShadow: '0 0 0 2px rgba(255, 20, 147, 0.12)'
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  background: '#FFF0F5',
                  boxShadow: '0 2px 8px rgba(255, 20, 147, 0.04)',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    background: '#FFF0F5',
                    '& fieldset': {
                      borderColor: 'rgba(255, 20, 147, 0.18)'
                    },
                    '&:hover fieldset': {
                      borderColor: '#FFB6D5'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF1493',
                      boxShadow: '0 0 0 2px rgba(255, 20, 147, 0.12)'
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                helperText="Password must be at least 6 characters long"
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  background: '#FFF0F5',
                  boxShadow: '0 2px 8px rgba(255, 20, 147, 0.04)',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    background: '#FFF0F5',
                    '& fieldset': {
                      borderColor: 'rgba(255, 20, 147, 0.18)'
                    },
                    '&:hover fieldset': {
                      borderColor: '#FFB6D5'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF1493',
                      boxShadow: '0 0 0 2px rgba(255, 20, 147, 0.12)'
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  background: '#FFF0F5',
                  boxShadow: '0 2px 8px rgba(255, 20, 147, 0.04)',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    background: '#FFF0F5',
                    '& fieldset': {
                      borderColor: 'rgba(255, 20, 147, 0.18)'
                    },
                    '&:hover fieldset': {
                      borderColor: '#FFB6D5'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#FF1493',
                      boxShadow: '0 0 0 2px rgba(255, 20, 147, 0.12)'
                    }
                  }
                }}
              />
              <Box sx={{ mt: 1, mb: 1, width: '100%' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#7C3A58', fontWeight: 600 }}>
                  I am a:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant={role === 'performer' ? 'contained' : 'outlined'}
                    onClick={() => setRole('performer')}
                    sx={{
                      flex: 1,
                      borderRadius: 3,
                      background: role === 'performer' ? 'linear-gradient(90deg, #FFB6D5 0%, #FF1493 100%)' : 'transparent',
                      color: role === 'performer' ? '#fff' : '#FF1493',
                      fontWeight: 700,
                      boxShadow: role === 'performer' ? '0 2px 8px rgba(255, 20, 147, 0.10)' : 'none',
                      borderColor: '#FF1493',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #FF1493 0%, #FFB6D5 100%)',
                        color: '#fff',
                        opacity: 0.95
                      }
                    }}
                  >
                    Performer
                  </Button>
                  <Button
                    variant={role === 'instructor' ? 'contained' : 'outlined'}
                    onClick={() => setRole('instructor')}
                    sx={{
                      flex: 1,
                      borderRadius: 3,
                      background: role === 'instructor' ? 'linear-gradient(90deg, #FFB6D5 0%, #FF1493 100%)' : 'transparent',
                      color: role === 'instructor' ? '#fff' : '#FF1493',
                      fontWeight: 700,
                      boxShadow: role === 'instructor' ? '0 2px 8px rgba(255, 20, 147, 0.10)' : 'none',
                      borderColor: '#FF1493',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #FF1493 0%, #FFB6D5 100%)',
                        color: '#fff',
                        opacity: 0.95
                      }
                    }}
                  >
                    Instructor
                  </Button>
                </Box>
              </Box>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{
                  mt: 1,
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #FFB6D5 0%, #FF1493 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 16px rgba(255, 20, 147, 0.10)',
                  py: 1.2,
                  '&:hover': {
                    background: 'linear-gradient(90deg, #FF1493 0%, #FFB6D5 100%)',
                    opacity: 0.95
                  }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Register'}
              </Button>
            </Box>
          )}
        </Paper>
      </Fade>
    </Box>
  );
};

export default Login;

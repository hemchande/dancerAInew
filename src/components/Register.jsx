import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  OutlinedInput
} from '@mui/material';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'performer',
    genre: '',
    skill_level: '',
    techniques_to_improve: []
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData.email, formData.password, {
        name: formData.name,
        role: formData.role,
        genre: formData.genre,
        skill_level: formData.skill_level,
        techniques_to_improve: formData.techniques_to_improve
      });
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Register
          </Typography>
          {error && (
            <Typography color="error" align="center" gutterBottom>
              {error}
            </Typography>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
              >
                <MenuItem value="performer">Performer</MenuItem>
                <MenuItem value="instructor">Instructor</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Genre</InputLabel>
              <Select
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                label="Genre"
              >
                <MenuItem value="Ballet">Ballet</MenuItem>
                <MenuItem value="Contemporary">Contemporary</MenuItem>
                <MenuItem value="Jazz">Jazz</MenuItem>
                <MenuItem value="Hip Hop">Hip Hop</MenuItem>
                <MenuItem value="Tap">Tap</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Skill Level</InputLabel>
              <Select
                name="skill_level"
                value={formData.skill_level}
                onChange={handleChange}
                label="Skill Level"
              >
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
                <MenuItem value="Professional">Professional</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Techniques to Improve</InputLabel>
              <Select
                multiple
                name="techniques_to_improve"
                value={formData.techniques_to_improve}
                onChange={handleChange}
                input={<OutlinedInput label="Techniques to Improve" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="Pirouettes">Pirouettes</MenuItem>
                <MenuItem value="Jumps">Jumps</MenuItem>
                <MenuItem value="Extensions">Extensions</MenuItem>
                <MenuItem value="Balance">Balance</MenuItem>
                <MenuItem value="Flexibility">Flexibility</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
            >
              Register
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 
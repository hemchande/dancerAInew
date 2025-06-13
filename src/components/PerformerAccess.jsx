import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import axios from 'axios';
import { config } from '../config/config';

const PerformerAccess = () => {
  const [instructorId, setInstructorId] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    // Extract instructor ID from URL if present
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 2 && pathParts[1] === 'instructor') {
      setInstructorId(pathParts[2]);
      fetchInstructorContent(pathParts[2]);
    }
  }, []);

  const fetchInstructorContent = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`${config.API_URL}/instructor/${id}/content`);
      setTranscript(response.data.transcript);
      setFeedback(response.data.feedback || []);
    } catch (error) {
      setError('Failed to load instructor content');
      console.error('Error fetching instructor content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!instructorId) return;
    setLoading(true);
    try {
      const response = await axios.post(`${config.API_URL}/instructor/${instructorId}/feedback`, {
        query: transcript
      });
      setFeedback([...feedback, {
        role: 'ai',
        message: response.data.feedback
      }]);
    } catch (error) {
      setError('Failed to get feedback');
      console.error('Error getting feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Instructor Feedback Access
      </Typography>

      {!instructorId && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Enter Instructor ID
          </Typography>
          <TextField
            fullWidth
            label="Instructor ID"
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={() => fetchInstructorContent(instructorId)}
            sx={{ backgroundColor: '#FF1493' }}
          >
            Access Content
          </Button>
        </Paper>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress sx={{ color: '#FF1493' }} />
        </Box>
      )}

      {error && (
        <Paper sx={{ p: 2, mb: 4, backgroundColor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {transcript && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Class Transcript
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {transcript}
          </Typography>
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleSubmit}
            sx={{ mt: 2, backgroundColor: '#FF1493' }}
            disabled={loading}
          >
            Get Feedback
          </Button>
        </Paper>
      )}

      {feedback.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Feedback History
          </Typography>
          <List>
            {feedback.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={item.role === 'ai' ? '🤖 AI Feedback' : '🧑‍💻 Your Query'}
                    secondary={item.message}
                  />
                </ListItem>
                {index < feedback.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default PerformerAccess; 
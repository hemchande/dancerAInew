import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ExpertFeedback = () => {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [message, setMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const response = await fetch('http://localhost:8000/auth/instructors', {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });
      const data = await response.json();
      setInstructors(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      setLoading(false);
    }
  };

  const handleInstructorSelect = (instructor) => {
    setSelectedInstructor(instructor);
    setOpenDialog(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const response = await fetch('http://localhost:8000/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          title: `Chat with ${selectedInstructor.name}`,
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        }),
      });

      if (response.ok) {
        setMessage('');
        setOpenDialog(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return <div>Loading instructors...</div>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Connect with Expert Instructors
      </Typography>
      <Grid container spacing={3}>
        {instructors.map((instructor) => (
          <Grid item xs={12} sm={6} md={4} key={instructor.uid}>
            <Card>
              <CardContent>
                <ListItemAvatar>
                  <Avatar>{instructor.name[0]}</Avatar>
                </ListItemAvatar>
                <Typography variant="h6">{instructor.name}</Typography>
                <Typography color="textSecondary" gutterBottom>
                  {instructor.genre}
                </Typography>
                <Typography variant="body2">
                  Specializes in: {instructor.genre}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => handleInstructorSelect(instructor)}
                >
                  Connect
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          Connect with {selectedInstructor?.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Your message"
            fullWidth
            multiline
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSendMessage} color="primary">
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExpertFeedback; 
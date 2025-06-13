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
import { config } from '../config/config';

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
      const response = await fetch(`${config.API_URL}/auth/instructors`, {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setInstructors(data);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstructorSelect = (instructor) => {
    setSelectedInstructor(instructor);
    setOpenDialog(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedInstructor) return;

    try {
      const response = await fetch(`${config.API_URL}/chat/sessions`, {
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

  return (
    <Container>
      {/* Rest of the component code remains unchanged */}
    </Container>
  );
};

export default ExpertFeedback;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

const ChatUI = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const {
    chatSessions,
    currentSession,
    createNewSession,
    loadSession,
    sendMessage,
    deleteSession,
    updateSessionTitle,
  } = useChat();
  const { user } = useAuth();

  useEffect(() => {
    if (chatSessions.length > 0 && !currentSession) {
      loadSession(chatSessions[0]._id);
    }
  }, [chatSessions]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      await sendMessage(input);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      await createNewSession();
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteSession(sessionId);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleEditTitle = (session) => {
    setEditingSession(session);
    setNewTitle(session.title);
    setEditDialogOpen(true);
  };

  const handleSaveTitle = async () => {
    if (editingSession && newTitle.trim()) {
      try {
        await updateSessionTitle(editingSession._id, newTitle);
        setEditDialogOpen(false);
      } catch (error) {
        console.error('Error updating title:', error);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <Paper sx={{ width: 300, p: 2, borderRight: '1px solid #eee' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Chat Sessions</Typography>
          <IconButton onClick={handleNewChat} color="primary">
            <AddIcon />
          </IconButton>
        </Box>
        <List>
          {chatSessions.map((session) => (
            <ListItem
              key={session._id}
              selected={currentSession?._id === session._id}
              onClick={() => loadSession(session._id)}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemText
                primary={session.title}
                secondary={new Date(session.createdAt).toLocaleDateString()}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTitle(session);
                  }}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session._id);
                  }}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentSession ? (
          <>
            <Paper sx={{ flex: 1, overflow: 'auto', p: 2, mb: 2 }}>
              {currentSession.messages.map((message, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 'bold',
                      color: message.role === 'user' ? '#FF4500' : '#333'
                    }}
                  >
                    {message.role === 'user' ? '🧑‍💻' : '🤖'} {message.content}
                  </Typography>
                </Box>
              ))}
              {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
            </Paper>

            <Box sx={{ p: 2, backgroundColor: '#fff' }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Type your message..."
                  variant="outlined"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  onClick={handleSendMessage}
                  disabled={loading}
                  sx={{ backgroundColor: '#FF1493' }}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="h6" color="textSecondary">
              Select a chat or start a new one
            </Typography>
          </Box>
        )}
      </Box>

      {/* Edit Title Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Chat Title</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTitle} sx={{ color: '#FF1493' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatUI; 
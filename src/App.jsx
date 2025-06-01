import React, { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Container, List, ListItem, Divider, CircularProgress, TextField, Button, Paper, Menu, MenuItem, Avatar, IconButton, ThemeProvider, createTheme } from '@mui/material';
import { YouTube, Search, SmartToy, History as HistoryIcon, Feedback as FeedbackIcon, Chat as ChatIcon, Assessment as ReportIcon, AccountCircle, VideoCall as VideoCallIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import Stats from './components/Summary';
import BalletCamera from './components/Camera';
import BalletCamera1 from './components/newCamera';
import { OpenAI } from 'openai';
import InstructorDashboard from './components/InstructorDashboard';
import PerformerAccess from './components/PerformerAccess';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider, useChat } from './contexts/ChatContext';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './components/Register';
import ExpertFeedback from './components/ExpertFeedback';
import Navigation from './components/Navigation';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const mockChatHistory = [
  { role: 'user', message: 'How do I improve my pirouette balance?' },
  { role: 'ai', message: 'Practicing spotting can help. I found these resources:' },
  { role: 'action', type: 'google', result: 'Best Pirouette Balance Drills', link: 'https://www.dancebalancetips.com' }
];



const ChatUI = () => {
  const navigate = useNavigate();
  const { user, getAuthToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  useEffect(() => {
    const fetchChatSessions = async () => {
      try {
        if (!user) return;
        
        const token = await getAuthToken();
        const response = await axios.get('http://localhost:8000/chat/sessions', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log(response.data)
        
        const sessions = response.data.map(session => ({
          id: session._id,
          name: session.title,
          messages: session.messages || []
        }));

        setChatSessions(sessions);
        if (sessions.length > 0 && !currentSessionId) {
          setCurrentSessionId(sessions[0].id);
          setMessages(sessions[0].messages);
        }
      } catch (error) {
        console.error('Error fetching chat sessions:', error);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    fetchChatSessions();
  }, [user]);

  const handleNewChat = async () => {
    try {
      const token = await getAuthToken();
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });

      const response = await axios.post(
        'http://localhost:8000/chat/sessions',
        { title: `${formattedDate} session` },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log(response.data)

      const newSession = {
        id: response.data._id,
        name: response.data.title,
        messages: []
      };

      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating new chat session:', error);
    }
  };

  const handleSessionClick = async (sessionId) => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`http://localhost:8000/chat/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Session data:', response.data);
      setCurrentSessionId(sessionId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const streamOpenAIResponse = async ({ messages, onToken }) => {
    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        max_tokens: 250,
        temperature: 0.7,
        stream: true
      });
  
      let fullMessage = '';
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        fullMessage += token;
        if (onToken) onToken(token);
      }
  
      return fullMessage;
    } catch (err) {
      console.error('Streaming error:', err);
      return '⚠️ Error generating feedback.';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !currentSessionId) return;
  
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
  
    try {
      const token = await getAuthToken();
      
      // Save user message
      let response = await axios.post(
        `http://localhost:8000/chat/sessions/${currentSessionId}/messages`,
        userMessage,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('User message response:', response.data);

      // Generate AI response
      const safeHistory = messages
        .filter(msg => ['user', 'ai', 'assistant'].includes(msg.role))
        .map(({ role, content }) => ({
          role: role === 'ai' ? 'assistant' : role,
          content
        }));

      let generatedMessage = '';
      await streamOpenAIResponse({
        messages: [...safeHistory, { role: 'user', content: input }],
        onToken: (token) => {
          generatedMessage += token;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0 && newMessages[lastIndex].role === 'ai') {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: generatedMessage
              };
            } else {
              newMessages.push({ role: 'ai', content: generatedMessage });
            }
            return newMessages;
          });
        }
      });

      // Save AI message
      const aiMessage = { role: 'ai', content: generatedMessage };
      let response2 = await axios.post(
        `http://localhost:8000/chat/sessions/${currentSessionId}/messages`,
        aiMessage,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('AI message response:', response2.data);

      // Update chat sessions list with both messages
      setChatSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          const updatedSession = {
            ...session,
            messages: [...session.messages, userMessage, aiMessage]
          };
          console.log('Updated session:', updatedSession);
          return updatedSession;
        }
        return session;
      }));

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const token = await getAuthToken();
      await axios.delete(`http://localhost:8000/chat/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleStartRecording = () => {
    navigate('/balletCamera');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Box sx={{ width: 280, backgroundColor: '#F8F9FA', p: 2, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Button 
          variant="contained" 
          sx={{ backgroundColor: '#FF1493', width: '100%', mb: 2 }}
          onClick={handleNewChat}
        >
          New Chat
        </Button>

        {/* Quick Access */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Quick Access</Typography>
        <List sx={{ mb: 2 }}>
          <ListItem button><HistoryIcon sx={{ color: '#FF1493', mr: 1 }} /><Typography variant="body1">Search History</Typography></ListItem>
          <ListItem button><FeedbackIcon sx={{ color: '#FF1493', mr: 1 }} /><Typography variant="body1">Saved Feedback</Typography></ListItem>
        </List>

        <Divider />

        {/* AI Dance Reports */}
        <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>AI Dance Reports</Typography>
        <List>
          {chatSessions.map(report => (
            <ListItem button key={report.id} onClick={() => navigate(`/aireports/${report.id}`)}>
              <ReportIcon sx={{ color: '#FF1493', mr: 1 }} /> {report.name}
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* Chat Sessions */}
        <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>Chat Sessions</Typography>
        <List>
          {isLoadingSessions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} sx={{ color: '#FF1493' }} />
            </Box>
          ) : (
            chatSessions.map(session => (
              <ListItem 
                button 
                key={session.id} 
                onClick={() => handleSessionClick(session.id)}
                sx={{ 
                  backgroundColor: currentSessionId === session.id ? 'rgba(255, 20, 147, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 20, 147, 0.05)'
                  }
                }}
              >
                <ChatIcon sx={{ color: '#FF1493', mr: 1 }} /> {session.name}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  sx={{ ml: 'auto' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItem>
            ))
          )}
        </List>
      </Box>

      <Toolbar>
        <IconButton onClick={handleStartRecording} sx={{ marginLeft: 'auto', color: '#FF1493' }}>
          <VideoCallIcon />
          <Typography sx={{ ml: 1 }}>Start Recording</Typography>
        </IconButton>
      </Toolbar>

      {/* Main Chat Section */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Toolbar>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ bgcolor: 'white', color: '#FF1493' }}>
              <AccountCircle />
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => alert('Profile Clicked')}>Profile</MenuItem>
            <MenuItem onClick={() => alert('Settings Clicked')}>Settings</MenuItem>
            <MenuItem onClick={() => alert('Logout Clicked')}>Logout</MenuItem>
          </Menu>
        </Toolbar>

        {/* Chat Panel */}
        <Container maxWidth="md" sx={{ mt: 2, p: 3, backgroundColor: '#fff', borderRadius: 3, boxShadow: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ flex: 1, overflow: 'auto', p: 2, mb: 2 }}>
            {messages.map((msg, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                {msg.role === 'user' && (
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#FF4500' }}>
                    🧑‍💻 {msg.content}
                  </Typography>
                )}
                {msg.role === 'ai' && (
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333' }}>
                    🤖 {msg.content}
                  </Typography>
                )}
                <Divider sx={{ my: 1 }} />
              </Box>
            ))}
            {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
          </Paper>

          {/* Input Field */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Type your message..." 
              variant="outlined"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              variant="contained"
              sx={{ backgroundColor: '#FF1493' }} 
              onClick={handleSendMessage}
              disabled={loading}
            >
              Send
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><ChatUI /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatUI /></ProtectedRoute>} />
            <Route path="/balletCamera" element={<ProtectedRoute><BalletCamera1 /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
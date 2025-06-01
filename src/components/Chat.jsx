import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, Container, List, ListItem, Divider, CircularProgress, TextField, Button, Paper, IconButton } from '@mui/material';
import { YouTube, Search, SmartToy, Add as AddIcon } from '@mui/icons-material';
import { OpenAI } from 'openai';
import { useChat } from '../contexts/ChatContext';

const mockChatHistory = [
  { role: 'user', message: 'How do I improve my pirouette balance?' },
  { role: 'ai', message: 'Practicing spotting can help. I found these resources:' },
  { role: 'action', type: 'google', result: 'Best Pirouette Balance Drills', link: 'https://www.dancebalancetips.com' },
  { role: 'action', type: 'youtube', result: 'Pirouette Mastery Video', link: 'https://www.youtube.com/watch?v=pirouette123' },
  { role: 'action', type: 'rag', result: 'Based on past sessions, try strengthening your core and engaging turnout muscles.' }
];

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const ChatUI = () => {
  const { chatSessions, createChatSession, loading } = useChat();
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (chatSessions.length > 0 && !currentSession) {
      setCurrentSession(chatSessions[0]);
      setMessages(chatSessions[0].messages || []);
    }
  }, [chatSessions]);

  const handleNewChat = async () => {
    try {
      const newSession = await createChatSession();
      setCurrentSession(newSession);
      setMessages([]);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const streamOpenAIResponse1 = async ({ messages, onToken }) => {
    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 250,
        temperature: 0.7,
        stream: true
      });
  
      let fullMessage = '';
      for await (const chunk of stream) {
        console.log(chunk)
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
    if (!input.trim() || !currentSession) return;
  
    const userMessage = { role: 'user', message: input };
    const safeHistory = [...messages, userMessage]
      .filter(msg => msg.role === 'user' || msg.role === 'ai')
      .map(({ role, content, message }) => ({
        role,
        content: content || message || ''
      }));
  
    setMessages(prev => [...prev, userMessage, { role: 'ai', message: '' }]);
    setInput('');
    setIsLoading(true);
  
    let generatedMessage = '';
  
    await streamOpenAIResponse1({
      messages: safeHistory,
      onToken: (token) => {
        generatedMessage += token;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'ai',
            message: generatedMessage
          };
          return updated;
        });
      }
    });
  
    setIsLoading(false);
  };

  const renderMessage = (msg, index) => {
    if (msg.type === 'camera_feedback') {
      return (
        <Box key={index} sx={{ mb: 2, p: 2, backgroundColor: '#FFF0F5', borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#FF1493', mb: 1 }}>
            Camera Feedback
          </Typography>
          {msg.imageUrl && (
            <img 
              src={msg.imageUrl} 
              alt="Dance pose" 
              style={{ 
                width: '100%', 
                maxHeight: '200px', 
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '8px'
              }} 
            />
          )}
          <Typography variant="body1">
            {msg.content}
          </Typography>
        </Box>
      );
    }

    return (
      <Box key={index} sx={{ mb: 2 }}>
        {msg.role === 'user' && (
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#007BFF' }}>
            🧑‍💻 {msg.message || msg.content}
          </Typography>
        )}
        {msg.role === 'ai' && (
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333' }}>
            🤖 {msg.message || msg.content}
            {isLoading && index === messages.length - 1 && <span className="typing-cursor">▍</span>}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <AppBar position="static" sx={{ backgroundColor: '#FF69B4' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Dance AI Assistant
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={handleNewChat}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }
            }}
          >
            <AddIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
  
      <Container maxWidth="md" sx={{ mt: 4, p: 3, backgroundColor: '#fff', borderRadius: 3, boxShadow: 2 }}>
        <Typography variant="h5" gutterBottom align="center">
          {currentSession?.title || 'AI Dance Chat'}
        </Typography>
  
        <Paper sx={{ maxHeight: 400, overflow: 'auto', p: 2, mb: 2 }}>
          {messages.map((msg, index) => renderMessage(msg, index))}
        </Paper>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={!currentSession}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!input.trim() || !currentSession || isLoading}
            sx={{ 
              backgroundColor: '#FF69B4',
              '&:hover': {
                backgroundColor: '#FF1493',
              }
            }}
          >
            Send
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default ChatUI;



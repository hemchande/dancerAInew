import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const ChatContext = createContext();

export const useChat = () => {
  return useContext(ChatContext);
};

export const ChatProvider = ({ children }) => {
  const [chatSessions, setChatSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, getAuthToken } = useAuth();

  const loadChatSessions = async () => {
    try {
      if (!user) return;
      
      const token = await getAuthToken();
      const response = await axios.get('http://localhost:8000/chat/sessions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setChatSessions(response.data);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      throw new Error('Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadChatSessions();
    }
  }, [user]);

  const createChatSession = async (title = 'New Chat') => {
    try {
      const token = await getAuthToken();
      const response = await axios.post('http://localhost:8000/chat/sessions', 
        { title },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setChatSessions(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  };

  const saveCameraFeedback = async (feedback, imageUrl, sessionId) => {
    try {
      const token = await getAuthToken();
      const response = await axios.post(
        `http://localhost:8000/chat/sessions/${sessionId}/messages`,
        {
          role: 'ai',
          content: feedback,
          type: 'camera_feedback',
          imageUrl
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Update the chat sessions with the new message
      setChatSessions(prev => prev.map(session => {
        if (session._id === sessionId) {
          return {
            ...session,
            messages: [...session.messages, response.data]
          };
        }
        return session;
      }));

      return response.data;
    } catch (error) {
      console.error('Error saving camera feedback:', error);
      throw error;
    }
  };

  const deleteChatSession = async (sessionId) => {
    try {
      const token = await getAuthToken();
      await axios.delete(`http://localhost:8000/chat/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setChatSessions(prev => prev.filter(session => session._id !== sessionId));
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  };

  const value = {
    chatSessions,
    loading,
    createChatSession,
    deleteChatSession,
    loadChatSessions,
    saveCameraFeedback
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 
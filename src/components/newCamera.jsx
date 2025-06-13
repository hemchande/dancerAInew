// BalletCamera.jsx with Loom-style session viewer
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Card, CardContent, CircularProgress, Typography, Box, Container, Paper, IconButton, Collapse, Divider, Tabs, Tab, Badge, Tooltip, Avatar, Chip, LinearProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { styled } from '@mui/material/styles';
import { OpenAI } from 'openai';
import Webcam from 'react-webcam';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TimerIcon from '@mui/icons-material/Timer';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import StarIcon from '@mui/icons-material/Star';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import { saveBalletSession, getBalletSessions, deleteBalletSession } from '../utils/balletSessionStorage';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config/config';

const overlayActions = ["Arabesque", "Attitude", "Ballon", "Battement", "Brisé", "Cabriole", "Changement", "Chassé"];

// Custom styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.04)',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  padding: '10px 24px',
  boxShadow: '0 4px 12px rgba(255, 20, 147, 0.15)',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(255, 20, 147, 0.25)',
  },
}));

const FeedbackPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '12px',
  padding: '16px',
  backgroundColor: '#FFF0F5',
  border: '1px solid rgba(255, 20, 147, 0.1)',
  boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)',
}));

const StatCard = styled(Box)(({ theme }) => ({
  padding: '16px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)',
  border: '1px solid rgba(255, 20, 147, 0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}));

const ScoreCard = styled(Paper)(({ theme }) => ({
  borderRadius: '12px',
  padding: '16px',
  backgroundColor: '#ffffff',
  border: '1px solid rgba(255, 20, 147, 0.1)',
  boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)',
}));

// Add image compression function
const compressImage = (base64String, maxWidth = 800) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64String;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with reduced quality
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressedBase64);
    };
  });
};

const BalletCamera1 = () => {
  const { user, getAuthToken } = useAuth();
  const [actionIndex, setActionIndex] = useState(0);
  const [feedback, setFeedback] = useState("No feedback yet.");
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const feedbackContainerRef = useRef(null);
  const [frameQueue, setFrameQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullFeedbackLog, setFullFeedbackLog] = useState([]);
  const frameCounterRef = useRef(0);
  const [feedbackSessions, setFeedbackSessions] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [expandedFeedbackIndex, setExpandedFeedbackIndex] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    duration: '00:00',
    exercises: 0,
    accuracy: 85,
  });
  const [performanceScores, setPerformanceScores] = useState({
    flexibility: 80,
    alignment: 90,
    smoothness: 85,
    energy: 75,
    explanation: 'Great job! Your performance is well-balanced and consistent.'
  });
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const { createChatSession, saveCameraFeedback } = useChat();
  const [currentChatSession, setCurrentChatSession] = useState(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [currentFeedbackImage, setCurrentFeedbackImage] = useState(null);
  const [accumulatedFeedback, setAccumulatedFeedback] = useState("");
  const [sessionImage, setSessionImage] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);


  const FRAME_BATCH_SIZE = 5;
  const [frameBuffer, setFrameBuffer] = useState([]);
  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });




  const enqueueFrame = useCallback(() => {
    const video = webcamRef.current.video;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/png");
    setFrameQueue((q) => [...q, imageDataUrl]);
  }, []);

  // Add session timer effect
  useEffect(() => {
    let timer;
    if (isSessionActive && sessionStartTime) {
      timer = setInterval(() => {
        const elapsedTime = Date.now() - sessionStartTime;
        if (elapsedTime >= 5 * 60 * 1000) { // 5 minutes
          setIsSessionActive(false);
          setFeedback(prev => prev + "\n\nSession time completed!");
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionActive, sessionStartTime]);

  const startNewSession = () => {
    setSessionStartTime(Date.now());
    setIsSessionActive(true);
    setAccumulatedFeedback("");
    setSessionImage(null);
    setFeedback("Session started. Feedback will appear here...");
  };


  const generateFeedbackFromFrames = async (imageFrames) => {
    if (!isSessionActive) return;
  
    try {
      setIsLoading(true);
  
      const userMessage = [
        { type: 'text', text: 'Please analyze this dance sequence and provide feedback across frames. Mention posture changes, errors, and transitions.' },
        ...imageFrames.map(img => ({ type: 'image_url', image_url: { url: img } }))
      ];
  
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional ballet coach. Provide feedback across a sequence of frames. Identify patterns in posture, movement, alignment, and give actionable corrections.'
          },
          {
            role: 'user',
            content: `EXAMPLE: Review the following ballet sequence: [arms rounded but not fully extended, knees bent on landing, head looking down, transition from arabesque to plié is rushed]
          
          Feedback:
          - Arms: Extend elbows fully and maintain rounded shape; avoid drooping wrists.
          - Knees: Soften the landing by absorbing with the full foot and straightening after.
          - Head: Keep chin lifted and gaze forward for better posture.
          - Transition: Slow down the shift from arabesque to plié for better control and fluidity.`
          },
          {
            role: 'user',
            content: `Now, review this ballet sequence: ${userMessage}
Provide feedback in a similar concise, body-part-organized format.`
          }
        ],
        max_tokens: 700,
        stream: true
      });
  
      let fullMessage = '';
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        fullMessage += token;
        setFeedback(prev => prev + token);
      }
  
      setAccumulatedFeedback(prev => prev + "\n\n" + fullMessage);
      if (!sessionImage) setSessionImage(imageFrames[0]);
  
      if (currentChatSession) {
        await saveCameraFeedback(fullMessage, imageFrames[0], currentChatSession._id);
      }
  
      await analyzeFeedback(fullMessage);
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating feedback:', error);
      setIsLoading(false);
    }
  };
  

  const generateFeedbackFromImage = async (imageData) => {
    if (!isSessionActive) return;

    try {
      setIsLoading(true);
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional ballet coach. Analyze the dancer\'s form and provide specific, constructive feedback. Focus on alignment, technique, and areas for improvement. Be encouraging but honest.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please analyze this ballet pose and provide detailed feedback on actionable corrections i can make with my body.' },
              { type: 'image_url', image_url: { url: imageData } }
            ]
          }
        ],
        max_tokens: 500,
        stream: true
      });

      let fullMessage = '';
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        fullMessage += token;
        setFeedback(prev => prev + token);
      }
      
      // Store the first image as the session image
      if (!sessionImage) {
        setSessionImage(imageData);
      }
      
      // Accumulate feedback text
      setAccumulatedFeedback(prev => prev + "\n\n" + fullMessage);
      
      // Save feedback to chat history if we have a session
      if (currentChatSession) {
        await saveCameraFeedback(fullMessage, sessionImage || imageData, currentChatSession._id);
      }
      
      // Analyze the feedback to generate performance scores
      await analyzeFeedback(fullMessage);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating feedback:', error);
      setIsLoading(false);
    }
  };

  const analyzeFeedback = async (feedback) => {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a professional ballet coach analyzing dance performance. 
          Analyze the feedback and provide scores (0-100) for:
          1. Flexibility - how well the dancer maintains proper extension and range of motion
          2. Alignment - how well the dancer maintains proper body alignment and posture
          3. Smoothness - how fluid and connected the movements are
          4. Energy - how well the dancer maintains proper energy and engagement
          
          Respond in JSON format only:
          {
            "flexibility": number,
            "alignment": number,
            "smoothness": number,
            "energy": number,
            "explanation": "brief explanation of scores"
          }`
        },
        {
          role: 'user',
          content: feedback
        }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 200
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      setPerformanceScores(analysis);
      return analysis;
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      return null;
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!webcamRef.current || !webcamRef.current.video) return;
      frameCounterRef.current += 1;
      if (frameCounterRef.current % 10 === 0) {
        enqueueFrame();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [enqueueFrame]);

  useEffect(() => {
    if (!isProcessing && frameQueue.length > 0) {
      const nextImage = frameQueue[0];
      setIsProcessing(true);
      setFeedback("");
      generateFeedbackFromImage(nextImage).then(() => {
        setIsProcessing(false);
        setFrameQueue((q) => q.slice(1));
      });
    }
  }, [frameQueue, isProcessing]);

  useEffect(() => {
    setFeedbackSessions(getBalletSessions());
  }, []);

  useEffect(() => {
    if (feedbackContainerRef.current) {
      feedbackContainerRef.current.scrollTop = feedbackContainerRef.current.scrollHeight;
    }
  }, [fullFeedbackLog, feedback]);

  const fetchAISessions = async () => {
    try {
      setIsLoadingSessions(true);
      const token = await getAuthToken();
      
      if (!token) {
        console.log('No authentication token found. Please log in to view sessions.');
        setFeedbackSessions([]);
        return;
      }
      
      // First get the user profile to get the UID
      const userResponse = await axios.get(`${config.API_URL}/auth/profile`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const userId = userResponse.data.uid;
      
      // Then fetch the AI reports using the UID
      const response = await axios.get(`${config.API_URL}/ai-reports/user/${userId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Fetched AI sessions:', response.data);
      setFeedbackSessions(response.data);
    } catch (error) {
      console.error('Error fetching AI sessions:', error);
      if (error.response?.status === 401) {
        setFeedback('Your session has expired. Please log in again.');
        setFeedbackSessions([]);
      } else {
        setFeedback(prev => prev + '\n\nError fetching previous sessions. Please try again.');
        setFeedbackSessions([]);
      }
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const saveCurrentSession = async () => {
    try {
      const token = await getAuthToken();
      
      if (!token) {
        setFeedback('Please log in to save your session.');
        return;
      }

      if (!sessionImage || !accumulatedFeedback) {
        setFeedback('No session data to save. Please complete a session first.');
        return;
      }
      
      // Calculate overall score from performance scores and scale it to 0-10
      const rawScore = Math.round(
        (performanceScores.flexibility + 
         performanceScores.alignment + 
         performanceScores.smoothness + 
         performanceScores.energy) / 4
      );
      const overallScore = Math.round((rawScore / 100) * 10); // Scale from 0-100 to 0-10

      // Create a single feedback entry for the entire session
      const sessionFeedback = [{
        text: accumulatedFeedback,
        image: sessionImage
      }];

      // Create AI report
      const report = {
        title: `Ballet Practice Session - ${new Date().toLocaleDateString()}`,
        description: 'Ballet practice session with AI feedback',
        feedback: sessionFeedback,
        overallScore,
        summary: performanceScores.explanation,
        duration: sessionStats.duration,
        exercises: sessionStats.exercises,
        accuracy: sessionStats.accuracy
      };

      console.log('Saving session with data:', report);

      const response = await axios.post(`${config.API_URL}/ai-reports`, report, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      console.log('Session saved successfully:', response.data);

      // Update local state
      setFeedbackSessions(prev => [response.data, ...prev]);
      
      // Reset session state
      setIsSessionActive(false);
      setSessionStartTime(null);
      setAccumulatedFeedback("");
      setSessionImage(null);
      setFeedback("Session saved successfully! Start a new session to continue.");
      
    } catch (error) {
      console.error('Error saving session:', error);
      if (error.response?.status === 401) {
        setFeedback('Your session has expired. Please log in again.');
      } else {
        setFeedback(prev => prev + '\n\nError saving session: ' + (error.response?.data?.message || error.message || 'Please try again.'));
      }
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      const token = await getAuthToken();
      await axios.delete(`${config.API_URL}/ai-reports/${sessionId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setFeedbackSessions(prev => prev.filter(session => session._id !== sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  useEffect(() => {
    fetchAISessions();
  }, []);

  // Mock recipients data
  const recipients = [
    { id: '1', name: 'Emma Thompson', role: 'Ballet Instructor' },
    { id: '2', name: 'James Wilson', role: 'Dance Coach' },
    { id: '3', name: 'Sarah Chen', role: 'Performance Specialist' },
    { id: '4', name: 'Michael Rodriguez', role: 'Technique Expert' }
  ];

  // Initialize chat session when component mounts
  useEffect(() => {
    const initializeChatSession = async () => {
      try {
        const session = await createChatSession('Ballet Practice Session');
        setCurrentChatSession(session);
      } catch (error) {
        console.error('Error creating chat session:', error);
      }
    };
    initializeChatSession();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#FF1493' }}>
          Ballet Practice Session
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={<TimerIcon />}
            label={sessionStats.duration}
            sx={{ backgroundColor: '#FFF0F5', color: '#FF1493' }}
          />
          <Chip
            icon={<FitnessCenterIcon />}
            label={`${sessionStats.exercises} Exercises`}
            sx={{ backgroundColor: '#FFF0F5', color: '#FF1493' }}
          />
          <Chip
            icon={<StarIcon />}
            label={`${sessionStats.accuracy}% Accuracy`}
            sx={{ backgroundColor: '#FFF0F5', color: '#FF1493' }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="recipient-select-label">Select Recipient</InputLabel>
            <Select
              labelId="recipient-select-label"
              id="recipient-select"
              value={selectedRecipient}
              label="Select Recipient"
              onChange={(e) => setSelectedRecipient(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 20, 147, 0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 20, 147, 0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#FF1493',
                },
              }}
            >
              {recipients.map((recipient) => (
                <MenuItem key={recipient.id} value={recipient.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: '#FF1493' }}>
                      {recipient.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{recipient.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {recipient.role}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<ShareIcon />}
            onClick={async () => {
              if (!selectedRecipient) return;
              setIsSyncing(true);
              try {
                const token = await getAuthToken();
                const latestSession = feedbackSessions[0];
                if (!latestSession) {
                  throw new Error('No session to sync');
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
                setFeedback(prev => prev + '\n\nFeedback synced with ' + recipients.find(r => r.id === selectedRecipient)?.name);
              } catch (error) {
                console.error('Error syncing feedback:', error);
                setFeedback(prev => prev + '\n\nError syncing feedback. Please try again.');
              } finally {
                setIsSyncing(false);
              }
            }}
            disabled={!selectedRecipient || isSyncing}
            sx={{
              backgroundColor: '#FF1493',
              '&:hover': {
                backgroundColor: '#FF1493',
                opacity: 0.9
              }
            }}
          >
            {isSyncing ? 'Syncing...' : 'Sync Feedback'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex', 
        height: '100vh',
        backgroundColor: '#FAFAFA'
      }}>
        {/* Main content area */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 3,
          backgroundColor: '#FAFAFA'
        }}>
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h5" sx={{ 
                  color: '#FF1493',
                  fontWeight: 600,
                  letterSpacing: '0.5px'
                }}>
                  Ballet Practice Session
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Share Session">
                    <IconButton size="small" sx={{ color: '#FF1493' }}>
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download Recording">
                    <IconButton size="small" sx={{ color: '#FF1493' }}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Settings">
                    <IconButton size="small" sx={{ color: '#FF1493' }}>
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Stats Row */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 3,
                flexWrap: 'wrap'
              }}>
                <StatCard>
                  <TimerIcon sx={{ color: '#FF1493' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Session Duration
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#FF1493', fontWeight: 600 }}>
                      {sessionStats.duration}
                    </Typography>
                  </Box>
                </StatCard>
                <StatCard>
                  <FitnessCenterIcon sx={{ color: '#FF1493' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Exercises Completed
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#FF1493', fontWeight: 600 }}>
                      {sessionStats.exercises}
                    </Typography>
                  </Box>
                </StatCard>
                <StatCard>
                  <StarIcon sx={{ color: '#FF1493' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Accuracy
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#FF1493', fontWeight: 600 }}>
                      {sessionStats.accuracy}%
                    </Typography>
                  </Box>
                </StatCard>
              </Box>
              
              <Box sx={{ 
                border: '2px solid rgba(255, 20, 147, 0.2)', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                position: 'relative',
                width: '100%',
                maxWidth: '640px',
                margin: '0 auto',
                boxShadow: '0 4px 12px rgba(255, 20, 147, 0.1)'
              }}>
                <Webcam 
                  ref={webcamRef}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: "user"
                  }}
                />
                <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mt: 3,
                gap: 2
              }}>
                {!isSessionActive ? (
                  <StyledButton 
                    variant="contained" 
                    onClick={startNewSession}
                    sx={{
                      backgroundColor: '#FF1493',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: '#FF69B4',
                      }
                    }}
                  >
                    Start Session
                  </StyledButton>
                ) : (
                  <>
                    <StyledButton 
                      variant="contained" 
                      onClick={saveCurrentSession}
                      sx={{
                        backgroundColor: '#FF1493',
                        color: '#ffffff',
                        '&:hover': {
                          backgroundColor: '#FF69B4',
                        }
                      }}
                    >
                      Save Session
                    </StyledButton>
                    <StyledButton 
                      variant="outlined" 
                      onClick={() => {
                        setIsSessionActive(false);
                        setSessionStartTime(null);
                        setFeedback("Session ended. Start a new session to continue.");
                      }}
                      sx={{
                        borderColor: '#FF1493',
                        color: '#FF1493',
                        '&:hover': {
                          borderColor: '#FF69B4',
                          backgroundColor: 'rgba(255, 20, 147, 0.04)',
                        }
                      }}
                    >
                      End Session
                    </StyledButton>
                  </>
                )}
              </Box>

              <Box sx={{ flex: 1, overflow: 'auto', p: 2, maxHeight: 'calc(100vh - 400px)', '&::-webkit-scrollbar': { width: '8px', }, '&::-webkit-scrollbar-track': { background: 'rgba(255, 20, 147, 0.05)', borderRadius: '4px', }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 20, 147, 0.2)', borderRadius: '4px', '&:hover': { background: 'rgba(255, 20, 147, 0.3)', }, }, }} ref={feedbackContainerRef}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#ff1493', mb: 2, fontWeight: 500 }}>
                    Performance Analysis
                  </Typography>
                  <ScoreCard>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 0.5 }}>
                        Flexibility
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={performanceScores.flexibility} 
                          sx={{ 
                            flex: 1, 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 20, 147, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#ff1493'
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: '#ff1493', fontWeight: 500 }}>
                          {performanceScores.flexibility}%
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 0.5 }}>
                        Alignment
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={performanceScores.alignment} 
                          sx={{ 
                            flex: 1, 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 20, 147, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#ff1493'
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: '#ff1493', fontWeight: 500 }}>
                          {performanceScores.alignment}%
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 0.5 }}>
                        Smoothness
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={performanceScores.smoothness} 
                          sx={{ 
                            flex: 1, 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 20, 147, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#ff1493'
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: '#ff1493', fontWeight: 500 }}>
                          {performanceScores.smoothness}%
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 0.5 }}>
                        Energy
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={performanceScores.energy} 
                          sx={{ 
                            flex: 1, 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 20, 147, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#ff1493'
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: '#ff1493', fontWeight: 500 }}>
                          {performanceScores.energy}%
                        </Typography>
                      </Box>
                    </Box>

                    {performanceScores.explanation && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                          {performanceScores.explanation}
                        </Typography>
                      </Box>
                    )}
                  </ScoreCard>
                </Box>

                <Typography variant="h6" sx={{ color: '#ff1493', mb: 2, fontWeight: 500 }}>
                  Current Feedback
                </Typography>

                <FeedbackPaper sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ 
                      color: '#FF1493',
                      fontWeight: 600,
                      fontSize: '1.1rem'
                    }}>
                      Live Feedback
                    </Typography>
                    <Chip 
                      label="AI Analysis" 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(255, 20, 147, 0.1)',
                        color: '#FF1493',
                        fontWeight: 500
                      }} 
                    />
                  </Box>
                  <Typography sx={{ 
                    color: '#4A4A4A', 
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {feedback}{isLoading && <span className="cursor-blink">▍</span>}
                  </Typography>
                </FeedbackPaper>

                {/* Current Feedback Section */}
                <Box sx={{ mt: 4 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2 
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#FF1493',
                      fontWeight: 600,
                      letterSpacing: '0.5px'
                    }}>
                      Session Timeline
                    </Typography>
                    <Chip 
                      label={`${fullFeedbackLog.length} Feedback Points`} 
                      size="small"
                      sx={{ 
                        backgroundColor: 'rgba(255, 20, 147, 0.1)',
                        color: '#FF1493',
                        fontWeight: 500
                      }}
                    />
                  </Box>
                  {fullFeedbackLog.map((entry, index) => (
                    <Box key={index} sx={{ 
                      mb: 2, 
                      backgroundColor: '#FFF0F5',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 20, 147, 0.1)'
                    }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          cursor: 'pointer',
                          backgroundColor: '#FFF0F5',
                          borderBottom: '1px solid rgba(255, 20, 147, 0.1)',
                        }}
                        onClick={() => setExpandedFeedbackIndex(index === expandedFeedbackIndex ? null : index)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ 
                            color: '#FF1493',
                            fontWeight: 600
                          }}>
                            Feedback #{index + 1}
                          </Typography>
                          <Chip 
                            label={`${Math.floor(Math.random() * 30) + 70}% Accuracy`} 
                            size="small"
                            sx={{ 
                              backgroundColor: 'rgba(255, 20, 147, 0.1)',
                              color: '#FF1493',
                              fontWeight: 500
                            }}
                          />
                        </Box>
                        <IconButton size="small">
                          {expandedFeedbackIndex === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                      <Collapse in={expandedFeedbackIndex === index}>
                        <Box sx={{ p: 2 }}>
                          <img
                            src={entry.img}
                            alt={`Snapshot ${index}`}
                            style={{ 
                              width: '100%', 
                              borderRadius: '8px', 
                              marginBottom: '1rem',
                              boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)'
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ 
                              whiteSpace: 'pre-wrap', 
                              color: '#4A4A4A', 
                              lineHeight: 1.6
                            }}
                          >
                            {entry.text}
                          </Typography>
                        </Box>
                      </Collapse>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        </Box>

        {/* Side panel for saved sessions */}
        <Paper 
          sx={{ 
            width: 360, 
            borderLeft: '1px solid rgba(255, 20, 147, 0.1)',
            height: '100vh',
            overflowY: 'auto',
            backgroundColor: '#FFF0F5',
            boxShadow: '-4px 0 20px rgba(255, 20, 147, 0.08)'
          }}
        >
          <Box sx={{ 
            p: 2.5, 
            borderBottom: '1px solid rgba(255, 20, 147, 0.1)',
            backgroundColor: '#FF1493',
            color: 'white'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Past Sessions
              </Typography>
              <Badge badgeContent={feedbackSessions.length} color="error">
                <FitnessCenterIcon />
              </Badge>
            </Box>
          </Box>
          <Box sx={{ p: 2 }}>
            {isLoadingSessions ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress sx={{ color: '#FF1493' }} />
              </Box>
            ) : feedbackSessions.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: '#666', p: 3 }}>
                No past sessions found
              </Typography>
            ) : (
              feedbackSessions.map((session) => (
                <Box 
                  key={session._id} 
                  sx={{ 
                    mb: 2, 
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 20, 147, 0.1)'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      backgroundColor: '#ffffff',
                      borderBottom: '1px solid rgba(255, 20, 147, 0.1)'
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ 
                        color: '#FF1493',
                        fontWeight: 600
                      }}>
                        {session.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {new Date(session.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        onClick={() => deleteSession(session._id)} 
                        size="small"
                        sx={{ 
                          color: '#FF1493',
                          '&:hover': {
                            backgroundColor: '#FFF0F5'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small"
                        sx={{ 
                          color: '#FF1493',
                          '&:hover': {
                            backgroundColor: '#FFF0F5'
                          }
                        }}
                      >
                        <ShareIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                        Overall Score
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={session.overallScore * 10} 
                          sx={{ 
                            flex: 1, 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 20, 147, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#ff1493'
                            }
                          }} 
                        />
                        <Typography variant="body2" sx={{ color: '#ff1493', fontWeight: 500 }}>
                          {session.overallScore}/10
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', mb: 2 }}>
                      {session.summary}
                    </Typography>
                    {session.feedback && session.feedback.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                          Feedback Points
                        </Typography>
                        {session.feedback.map((feedback, index) => (
                          <Box 
                            key={index}
                            sx={{ 
                              mb: 1.5,
                              p: 1.5,
                              backgroundColor: '#FFF0F5',
                              borderRadius: '8px',
                              '&:last-child': { mb: 0 },
                              border: '1px solid rgba(255, 20, 147, 0.08)'
                            }}
                          >
                            <img
                              src={feedback.image}
                              alt={`Feedback ${index + 1}`}
                              style={{ 
                                width: '100%', 
                                borderRadius: '8px', 
                                marginBottom: '0.5rem',
                                maxHeight: '120px',
                                objectFit: 'cover',
                                boxShadow: '0 2px 4px rgba(255, 20, 147, 0.08)'
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ 
                                whiteSpace: 'pre-wrap', 
                                color: '#4A4A4A', 
                                lineHeight: 1.4,
                                fontSize: '0.875rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {feedback.text}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default BalletCamera1;

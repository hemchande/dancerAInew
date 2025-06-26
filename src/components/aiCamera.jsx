import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, CardContent, CircularProgress, Typography, Box, Container, Paper, IconButton, Chip, LinearProgress, FormControl, InputLabel, Select, MenuItem, Tooltip, Avatar, Collapse, Badge } from '@mui/material';
import { styled } from '@mui/material/styles';
import Webcam from 'react-webcam';
import TimerIcon from '@mui/icons-material/Timer';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import StarIcon from '@mui/icons-material/Star';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { saveBalletSession, getBalletSessions, deleteBalletSession } from '../utils/balletSessionStorage';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import config from '../config/config';
import { OpenAI } from 'openai';
import { useWebSocket } from '../utils/useWebSocket';
import WebcamComponent from './webCamComponent';


const overlayActions = ["Arabesque", "Attitude", "Ballon", "Battement", "Brisé", "Cabriole", "Changement", "Chassé"];

// Styled components
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

const FRAME_BATCH_SIZE = 10;

const BalletCamera = () => {
  // Context & State
  const { user, getAuthToken } = useAuth();
  const { createChatSession, saveCameraFeedback } = useChat();
  const [meshImageUrl, setMeshImageUrl] = useState(null);

  const [feedback, setFeedback] = useState("No feedback yet.");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStats, setSessionStats] = useState({ duration: '00:00', exercises: 0, accuracy: 85 });
  const [performanceScores, setPerformanceScores] = useState({ flexibility: 80, alignment: 90, smoothness: 85, energy: 75, explanation: 'Great job! Your performance is well-balanced and consistent.' });
  const [feedbackSessions, setFeedbackSessions] = useState([]);
  const [currentChatSession, setCurrentChatSession] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [expandedFeedbackIndex, setExpandedFeedbackIndex] = useState(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionImage, setSessionImage] = useState(null);
  const [accumulatedFeedback, setAccumulatedFeedback] = useState("");
  const [fullFeedbackLog, setFullFeedbackLog] = useState([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [frameBuffer, setFrameBuffer] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [feedbackImages, setFeedbackImages] = useState([]);
  const webcamRef = useRef(null);
  // const canvasRef = useRef(null);
  const feedbackContainerRef = useRef(null);

  const [latestMeshImage, setLatestMeshImage] = useState(null);
  const sendFrame = useWebSocket(user.uid, (meshImage) => {
    console.log('🎯 Mesh result received from WebSocket:', meshImage ? 'Image data received' : 'No image data');
    setLatestMeshImage(meshImage);
  });

  // Debug logging for mesh state
  useEffect(() => {
    console.log('🔄 latestMeshImage state changed:', latestMeshImage ? 'Has data' : 'No data');
  }, [latestMeshImage]);

  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  // --- SESSION TIMER ---
  useEffect(() => {
    let timer;
    if (isSessionActive && sessionStartTime) {
      timer = setInterval(() => {
        const elapsedTime = Date.now() - sessionStartTime;
        if (elapsedTime >= 5 * 60 * 1000) {
          setIsSessionActive(false);
          setFeedback(prev => prev + "\n\nSession time completed!");
        } else {
          const mins = Math.floor(elapsedTime / 60000);
          const secs = Math.floor((elapsedTime % 60000) / 1000);
          setSessionStats(stats => ({
            ...stats,
            duration: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
          }));
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSessionActive, sessionStartTime]);

  // --- START SESSION ---
  // const startNewSession = () => {
  //   setSessionStartTime(Date.now());
  //   setIsSessionActive(true);
  //   setAccumulatedFeedback("");
  //   setSessionImage(null);
  //   setFeedback("Session started. Feedback will appear here...");
  //   setFullFeedbackLog([]);
  // };

  const startNewSession = () => {
    setSessionStartTime(Date.now());
    setIsSessionActive(true);
    setAccumulatedFeedback("");
    setSessionImage(null);
    setFeedback("Session started. Feedback will appear here...");
    setFullFeedbackLog([]);
  };

  const dataURLToBlob = (dataURL) => {
    if (!dataURL || !dataURL.includes(',')) {
      console.error('Invalid dataURL:', dataURL);
      return null;
    }
    const parts = dataURL.split(',');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const uploadFrameToInference = async (imageDataUrl) => {
    try {
      const blob = dataURLToBlob(imageDataUrl);
      if (!blob) throw new Error('Blob conversion failed');

      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');

      const response = await fetch('http://localhost:8001/upload-frame', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const imageBlob = await response.blob();
      return URL.createObjectURL(imageBlob);
    } catch (err) {
      console.error('Error generating feedback:', err);
      throw err;
    }
  };

  // --- FRAME CAPTURE BATCHING ---
  useEffect(() => {
    if (!isSessionActive) return;
    const interval = setInterval(() => {
      if (!webcamRef.current || !webcamRef.current.video) return;
      const video = webcamRef.current.video;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setFrameBuffer(prev => [...prev, imageDataUrl]);
    }, 300); // about 3 fps
    return () => clearInterval(interval);
  }, [isSessionActive]);

  // --- BATCH FEEDBACK TRIGGER ---
  useEffect(() => {
    if (!isSessionActive || isLoading || isProcessing || frameBuffer.length < FRAME_BATCH_SIZE) return;
    const batch = frameBuffer.slice(0, FRAME_BATCH_SIZE);
    setFrameBuffer(buf => buf.slice(FRAME_BATCH_SIZE));
    setIsProcessing(true);
    generateFeedbackFromFrames(batch).then(() => setIsProcessing(false));
    // eslint-disable-next-line
  }, [frameBuffer, isSessionActive, isLoading, isProcessing]);

  // --- BATCH FEEDBACK GENERATOR ---
  const generateFeedbackFromFrames = async (imageFrames) => {
    if (!isSessionActive || !imageFrames.length) return;

    try {
      setIsLoading(true);

      // const meshUrl = await uploadFrameToInference(imageFrames[0]);
      // setMeshImageUrl(meshUrl);

      // Multi-frame OpenAI input
      const userMessage = [
        { type: 'text', text: 'Analyze this dance sequence (10 frames). Provide feedback on posture, errors, and transitions.' },
        ...imageFrames.map(img => ({
          type: 'image_url',
          image_url: { url: img }
        }))
      ];

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional ballet coach. Provide frame-by-frame and overall feedback for the sequence.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 700,
        stream: true
      });

      let fullMessage = '';
      setFeedback(""); // Clear before new feedback
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

      // Log feedback points for timeline
      setFullFeedbackLog(log => [
        ...log,
        { img: imageFrames[imageFrames.length - 1], text: fullMessage }
      ]);


      const meshUrl = await uploadFrameToInference(imageFrames[imageFrames.length - 1]);
      setMeshImageUrl(meshUrl);


    } catch (error) {
      console.error('Error generating feedback:', error);
      setIsLoading(false);
    }
  };

  // --- PERFORMANCE ANALYSIS ---
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
        { role: 'user', content: feedback }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 200
      });


      console.log(response.choices[0].message.content)

      const analysis = JSON.parse(response.choices[0].message.content);
      console.log(analysis)
      setPerformanceScores(analysis);
      return analysis;
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      return null;
    }
  };

  // --- LOAD SAVED SESSIONS ---
  const fetchAISessions = async () => {
    try {
      setIsLoadingSessions(true);
      const token = await getAuthToken();
      if (!token) {
        setFeedbackSessions([]);
        return;
      }
      const userResponse = await axios.get(`${config.API_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userId = userResponse.data.uid;
      const response = await axios.get(`${config.API_URL}/ai-reports/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFeedbackSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setFeedbackSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // --- SAVE SESSION ---
  const saveCurrentSession = async () => {
    try {
      const token = await getAuthToken();
      if (!token || !sessionImage || !accumulatedFeedback) {
        setFeedback('Please complete a session first.');
        return;
      }

      // Calculate session metrics
      const rawScore = Math.round(
        (performanceScores.flexibility +
          performanceScores.alignment +
          performanceScores.smoothness +
          performanceScores.energy) / 4
      );
      const overallScore = Math.round((rawScore / 100) * 10);


      console.log(fullFeedbackLog)

      // Create feedback array from fullFeedbackLog
      const sessionFeedback = fullFeedbackLog.map(entry => ({
        text: entry.text,
        image: entry.img,
        timestamp: new Date().toISOString()
      }));

      // Prepare session data for database
      const sessionData = {
        title: `Ballet Practice Session - ${new Date().toLocaleDateString()}`,
        description: 'Ballet practice session with AI feedback',
        feedback: sessionFeedback,
        overallScore,
        summary: performanceScores.explanation,
        duration: sessionStats.duration,
        exercises: sessionStats.exercises,
        accuracy: sessionStats.accuracy,
        metrics: {
          flexibility: performanceScores.flexibility,
          alignment: performanceScores.alignment,
          smoothness: performanceScores.smoothness,
          energy: performanceScores.energy
        },
        startTime: sessionStartTime,
        endTime: Date.now(),
        status: 'completed'
      };

      // Save to database
      const response = await axios.post(`${config.API_URL}/ai-reports`, sessionData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Log successful save
      console.log('Session saved successfully:', response.data);

      // Update local state
      setFeedbackSessions(prev => [response.data, ...prev]);
      setIsSessionActive(false);
      setSessionStartTime(null);
      setAccumulatedFeedback("");
      setSessionImage(null);
      setFeedback("Session saved successfully! Start a new session to continue.");
      setFullFeedbackLog([]); // Clear the feedback log after saving

      // Additional logging for analytics
      try {
        await axios.post(`${config.API_URL}/analytics/session`, {
          sessionId: response.data._id,
          duration: sessionStats.duration,
          exerciseCount: sessionStats.exercises,
          averageAccuracy: sessionStats.accuracy,
          feedbackPoints: sessionFeedback.length
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (analyticsError) {
        console.error('Error saving analytics:', analyticsError);
        // Don't throw error as this is non-critical
      }

      // Fetch updated sessions after saving
      await fetchAISessions();

    } catch (error) {
      console.error('Error saving session:', error);
      setFeedback(prev => prev + '\n\nError saving session: ' + (error.response?.data?.message || error.message || 'Please try again.'));
    }
  };

  // Add function to handle session end
  const handleSessionEnd = async () => {
    if (isSessionActive) {
      await saveCurrentSession();
      await fetchAISessions(); // Fetch updated sessions after saving
    }
  
    // Clear the interval that was sending frames
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  
    setIsSessionActive(false);
    setSessionStartTime(null);
    setFeedback("Session ended. Start a new session to continue.");
  };
  

  // Update the end session button click handler
  const endSessionButton = (
    <StyledButton 
      variant="outlined" 
      onClick={handleSessionEnd} 
      sx={{ 
        borderColor: '#FF1493', 
        color: '#FF1493', 
        '&:hover': { 
          borderColor: '#FF69B4', 
          backgroundColor: 'rgba(255, 20, 147, 0.04)' 
        } 
      }}
    >
      End Session
    </StyledButton>
  );

  // --- DELETE SESSION ---
  const deleteSession = async (sessionId) => {
    try {
      const token = await getAuthToken();
      await axios.delete(`${config.API_URL}/ai-reports/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFeedbackSessions(prev => prev.filter(session => session._id !== sessionId));
    } catch (error) { }
  };

  // --- CREATE CHAT SESSION ON MOUNT ---
  useEffect(() => {
    const initializeChatSession = async () => {
      try {
        const session = await createChatSession('Ballet Practice Session');
        setCurrentChatSession(session);
      } catch (error) { }
    };
    initializeChatSession();
  }, []);

  // --- LOAD PAST SESSIONS ON MOUNT ---
  useEffect(() => {
    if (user) {
      fetchAISessions();
    }
  }, [user]); // Add user as dependency

  // --- SCROLL FEEDBACK CONTAINER TO BOTTOM ON UPDATE ---
  useEffect(() => {
    if (feedbackContainerRef.current) {
      feedbackContainerRef.current.scrollTop = feedbackContainerRef.current.scrollHeight;
    }
  }, [fullFeedbackLog, feedback]);

  // Mock recipients
  const recipients = [
    { id: '1', name: 'Emma Thompson', role: 'Ballet Instructor' },
    { id: '2', name: 'James Wilson', role: 'Dance Coach' },
    { id: '3', name: 'Sarah Chen', role: 'Performance Specialist' },
    { id: '4', name: 'Michael Rodriguez', role: 'Technique Expert' }
  ];

  // --- UI RENDER ---
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#FF1493' }}>
          Ballet Practice Session
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip icon={<TimerIcon />} label={sessionStats.duration} sx={{ backgroundColor: '#FFF0F5', color: '#FF1493' }} />
          <Chip icon={<FitnessCenterIcon />} label={`${sessionStats.exercises} Exercises`} sx={{ backgroundColor: '#FFF0F5', color: '#FF1493' }} />
          <Chip icon={<StarIcon />} label={`${sessionStats.accuracy}% Accuracy`} sx={{ backgroundColor: '#FFF0F5', color: '#FF1493' }} />
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
                    <Avatar sx={{ width: 24, height: 24, bgcolor: '#FF1493' }}>{recipient.name.charAt(0)}</Avatar>
                    <Box>
                      <Typography variant="body2">{recipient.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{recipient.role}</Typography>
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
                setFeedback(prev => prev + '\n\nError syncing feedback. Please try again.');
              } finally {
                setIsSyncing(false);
              }
            }}
            disabled={!selectedRecipient || isSyncing}
            sx={{ backgroundColor: '#FF1493', '&:hover': { backgroundColor: '#FF1493', opacity: 0.9 } }}
          >
            {isSyncing ? 'Syncing...' : 'Sync Feedback'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#FAFAFA' }}>
        <Box sx={{ flex: '0 1 1000px', overflow: 'auto', p: 3, backgroundColor: '#FAFAFA' }}>
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              {/* Camera & Stats */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ color: '#FF1493', fontWeight: 600, letterSpacing: '0.5px' }}>
                  Ballet Practice Session
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Share Session"><IconButton size="small" sx={{ color: '#FF1493' }}><ShareIcon /></IconButton></Tooltip>
                  <Tooltip title="Download Recording"><IconButton size="small" sx={{ color: '#FF1493' }}><DownloadIcon /></IconButton></Tooltip>
                  <Tooltip title="Settings"><IconButton size="small" sx={{ color: '#FF1493' }}><SettingsIcon /></IconButton></Tooltip>
                </Box>
              </Box>

              {/* Stats Row */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <StatCard>
                  <TimerIcon sx={{ color: '#FF1493' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666' }}>Session Duration</Typography>
                    <Typography variant="h6" sx={{ color: '#FF1493', fontWeight: 600 }}>{sessionStats.duration}</Typography>
                  </Box>
                </StatCard>
                <StatCard>
                  <FitnessCenterIcon sx={{ color: '#FF1493' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666' }}>Exercises Completed</Typography>
                    <Typography variant="h6" sx={{ color: '#FF1493', fontWeight: 600 }}>{sessionStats.exercises}</Typography>
                  </Box>
                </StatCard>
                <StatCard>
                  <StarIcon sx={{ color: '#FF1493' }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666' }}>Accuracy</Typography>
                    <Typography variant="h6" sx={{ color: '#FF1493', fontWeight: 600 }}>{sessionStats.accuracy}%</Typography>
                  </Box>
                </StatCard>
              </Box>

              {/* Webcam with Mesh Overlay */}
              <Box sx={{ border: '2px solid rgba(255, 20, 147, 0.2)', borderRadius: '16px', overflow: 'hidden', position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto', boxShadow: '0 4px 12px rgba(255, 20, 147, 0.1)' }}>
                <Webcam ref={webcamRef} style={{ width: '100%', height: 'auto', display: 'block' }} videoConstraints={{ width: 640, height: 480, facingMode: "user" }} />
                <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />
                
                {/* Mesh Overlay */}
                {latestMeshImage && (
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    zIndex: 10
                  }}>
                    <img 
                      src={`data:image/jpeg;base64,${latestMeshImage}`} 
                      alt="Pose Mesh Overlay" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        opacity: 0.8,
                        mixBlendMode: 'multiply'
                      }} 
                    />
                  </Box>
                )}
                
                {/* Overlay Status Indicator */}
                {latestMeshImage && (
                  <Box sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(0, 255, 0, 0.9)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    zIndex: 20
                  }}>
                    ✅ Live Mesh
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', justifyContent: 'center', mt: 2 }}>
                {/* <Box>
                  <Webcam ref={webcamRef} />
                </Box> */}

                <WebcamComponent sendFrame={sendFrame} />

                {meshImageUrl && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#FF1493', fontWeight: 600 }}>
                      3D Mesh (Latest)
                    </Typography>
                    <img src={meshImageUrl} alt="3D mesh" style={{ width: 320, height: 480, borderRadius: 12, border: '2px solid #FF1493' }} />
                  </Box>
                )}

                {/* WebSocket Mesh Results Display */}
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#FFF0F5', borderRadius: '12px', border: '2px solid #cccccc', minWidth: '320px' }}>
                  <Typography variant="h6" sx={{ color: '#FF1493', mb: 2, textAlign: 'center', fontSize: '1rem' }}>
                    🎯 Real-time Mesh Results
                  </Typography>
                  
                  {latestMeshImage ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ 
                        color: '#00ff00', 
                        fontWeight: 600, 
                        display: 'block', 
                        mb: 1,
                        fontSize: '0.9rem'
                      }}>
                        ✅ Live Pose Mesh (WebSocket)
                      </Typography>
                      <img 
                        src={`data:image/jpeg;base64,${latestMeshImage}`} 
                        alt="Pose Mesh" 
                        style={{ 
                          width: '100%', 
                          maxWidth: 320, 
                          height: 'auto', 
                          borderRadius: 8, 
                          border: '2px solid #00ff00',
                          boxShadow: '0 4px 12px rgba(0, 255, 0, 0.2)'
                        }} 
                      />
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ 
                        color: '#666666', 
                        fontWeight: 600, 
                        display: 'block', 
                        mb: 1
                      }}>
                        ⏳ Waiting for mesh data...
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#999999' }}>
                        Use the send frame button to test
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
                {!isSessionActive ? (
                  <>
                    <StyledButton 
                      variant="contained" 
                      onClick={startNewSession} 
                      sx={{ 
                        backgroundColor: '#FF1493', 
                        color: '#ffffff', 
                        '&:hover': { backgroundColor: '#FF69B4' } 
                      }}
                    >
                      Start Session
                    </StyledButton>
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        console.log('🎨 Test Mesh Display button clicked');
                        
                        // Create a mock mesh result for testing
                        const canvas = document.createElement("canvas");
                        canvas.width = 320;
                        canvas.height = 240;
                        const ctx = canvas.getContext("2d");
                        
                        // Draw a simple mock mesh overlay
                        ctx.fillStyle = '#00ff00';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = '#ff0000';
                        ctx.fillRect(50, 50, 50, 50);
                        ctx.fillStyle = '#0000ff';
                        ctx.fillRect(150, 100, 50, 50);
                        
                        const mockMeshData = canvas.toDataURL("image/jpeg", 0.8);
                        const base64Data = mockMeshData.split(',')[1];
                        
                        console.log('🎨 Canvas created, base64 data length:', base64Data.length);
                        console.log('🎨 Setting mock mesh result for testing...');
                        
                        setLatestMeshImage(base64Data);
                        
                        console.log('🎨 setLatestMeshImage called with data');
                      }}
                      sx={{ 
                        borderColor: '#ff6600', 
                        color: '#ff6600',
                        '&:hover': { 
                          borderColor: '#cc5200', 
                          backgroundColor: 'rgba(255, 102, 0, 0.1)' 
                        }
                      }}
                    >
                      🎨 Test Mesh Display
                    </Button>
                  </>
                ) : (
                  <>
                    <StyledButton 
                      variant="contained" 
                      onClick={saveCurrentSession} 
                      sx={{ 
                        backgroundColor: '#FF1493', 
                        color: '#ffffff', 
                        '&:hover': { backgroundColor: '#FF69B4' } 
                      }}
                    >
                      Save Session
                    </StyledButton>
                    {endSessionButton}
                  </>
                )}
              </Box>
              

              {/* Feedback and Timeline */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2, maxHeight: 'calc(100vh - 400px)', '&::-webkit-scrollbar': { width: '8px', }, '&::-webkit-scrollbar-track': { background: 'rgba(255, 20, 147, 0.05)', borderRadius: '4px', }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 20, 147, 0.2)', borderRadius: '4px', '&:hover': { background: 'rgba(255, 20, 147, 0.3)', }, }, }} ref={feedbackContainerRef}>
                {/* Performance */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#ff1493', mb: 2, fontWeight: 500 }}>
                    Performance Analysis
                  </Typography>
                  <ScoreCard>
                    {["flexibility", "alignment", "smoothness", "energy"].map(metric => (
                      <Box sx={{ mb: 2 }} key={metric}>
                        <Typography variant="subtitle2" sx={{ color: '#666', mb: 0.5 }}>{metric.charAt(0).toUpperCase() + metric.slice(1)}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress variant="determinate" value={performanceScores[metric]} sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 20, 147, 0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#ff1493' } }} />
                          <Typography variant="body2" sx={{ color: '#ff1493', fontWeight: 500 }}>{performanceScores[metric]}%</Typography>
                        </Box>
                      </Box>
                    ))}
                    {performanceScores.explanation && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>{performanceScores.explanation}</Typography>
                      </Box>
                    )}
                  </ScoreCard>
                </Box>
                {/* Current Feedback */}
                <Typography variant="h6" sx={{ color: '#ff1493', mb: 2, fontWeight: 500 }}>Current Feedback</Typography>
                <FeedbackPaper sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ color: '#FF1493', fontWeight: 600, fontSize: '1.1rem' }}>Live Feedback</Typography>
                    <Chip label="AI Analysis" size="small" sx={{ backgroundColor: 'rgba(255, 20, 147, 0.1)', color: '#FF1493', fontWeight: 500 }} />
                  </Box>
                  <Typography sx={{ color: '#4A4A4A', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {feedback}{isLoading && <span className="cursor-blink">▍</span>}
                  </Typography>
                </FeedbackPaper>
                {/* Timeline */}
                <Box sx={{ mt: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: '#FF1493', fontWeight: 600, letterSpacing: '0.5px' }}>
                      Session Timeline
                    </Typography>
                    <Chip label={`${fullFeedbackLog.length} Feedback Points`} size="small" sx={{ backgroundColor: 'rgba(255, 20, 147, 0.1)', color: '#FF1493', fontWeight: 500 }} />
                  </Box>
                  {fullFeedbackLog.map((entry, index) => (
                    <Box key={index} sx={{ mb: 2, backgroundColor: '#FFF0F5', borderRadius: '12px', boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)', overflow: 'hidden', border: '1px solid rgba(255, 20, 147, 0.1)' }}>
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
                          <Typography variant="subtitle2" sx={{ color: '#FF1493', fontWeight: 600 }}>
                            Feedback #{index + 1}
                          </Typography>
                          <Chip label={`${Math.floor(Math.random() * 30) + 70}% Accuracy`} size="small" sx={{ backgroundColor: 'rgba(255, 20, 147, 0.1)', color: '#FF1493', fontWeight: 500 }} />
                        </Box>
                        <IconButton size="small">
                          {expandedFeedbackIndex === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                      <Collapse in={expandedFeedbackIndex === index}>
                        <Box sx={{ p: 2 }}>
                          <img src={entry.img} alt={`Snapshot ${index}`} style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)' }} />
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#4A4A4A', lineHeight: 1.6 }}>
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
        <Paper sx={{ 
          width: 360, 
          borderLeft: '1px solid rgba(255, 20, 147, 0.1)', 
          height: '100vh', 
          overflowY: 'auto', 
          backgroundColor: '#FFF0F5', 
          boxShadow: '-4px 0 20px rgba(255, 20, 147, 0.08)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1
        }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255, 20, 147, 0.1)', backgroundColor: '#FF1493', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Past Sessions</Typography>
              <Badge badgeContent={feedbackSessions.length} color="error"><FitnessCenterIcon /></Badge>
            </Box>
          </Box>
          <Box sx={{ p: 2 }}>
            {isLoadingSessions ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress sx={{ color: '#FF1493' }} /></Box>
            ) : feedbackSessions.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: '#666', p: 3 }}>No past sessions found</Typography>
            ) : (
              feedbackSessions.map((session) => (
                <Box key={session._id} sx={{ mb: 2, backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)', overflow: 'hidden', border: '1px solid rgba(255, 20, 147, 0.1)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: '#ffffff', borderBottom: '1px solid rgba(255, 20, 147, 0.1)' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: '#FF1493', fontWeight: 600 }}>{session.title}</Typography>
                      <Typography variant="caption" sx={{ color: '#666' }}>{new Date(session.createdAt).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton onClick={() => deleteSession(session._id)} size="small" sx={{ color: '#FF1493', '&:hover': { backgroundColor: '#FFF0F5' } }}><DeleteIcon fontSize="small" /></IconButton>
                      <IconButton size="small" sx={{ color: '#FF1493', '&:hover': { backgroundColor: '#FFF0F5' } }}><ShareIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>Overall Score</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={session.overallScore * 10} sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 20, 147, 0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#ff1493' } }} />
                        <Typography variant="body2" sx={{ color: '#ff1493', fontWeight: 500 }}>{session.overallScore}/10</Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', mb: 2 }}>{session.summary}</Typography>
                    {session.feedback && session.feedback.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>Feedback Points ({session.feedback.length})</Typography>
                        <Box sx={{ maxHeight: '300px', overflowY: 'auto', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { background: 'rgba(255, 20, 147, 0.05)' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 20, 147, 0.2)', borderRadius: '3px' } }}>
                          {session.feedback.map((feedback, index) => (
                            <Box key={index} sx={{ mb: 1.5, p: 1.5, backgroundColor: '#FFF0F5', borderRadius: '8px', '&:last-child': { mb: 0 }, border: '1px solid rgba(255, 20, 147, 0.08)' }}>
                              <Box sx={{ position: 'relative', mb: 1 }}>
                                <img 
                                  src={feedback.image} 
                                  alt={`Feedback ${index + 1}`} 
                                  style={{ 
                                    width: '100%', 
                                    borderRadius: '8px', 
                                    maxHeight: '120px', 
                                    objectFit: 'cover', 
                                    boxShadow: '0 2px 4px rgba(255, 20, 147, 0.08)' 
                                  }} 
                                />
                                <Chip 
                                  label={`Point ${index + 1}`} 
                                  size="small" 
                                  sx={{ 
                                    position: 'absolute', 
                                    top: 8, 
                                    right: 8, 
                                    backgroundColor: 'rgba(255, 20, 147, 0.9)', 
                                    color: 'white',
                                    fontWeight: 500
                                  }} 
                                />
                              </Box>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#4A4A4A', 
                                  lineHeight: 1.4, 
                                  fontSize: '0.875rem',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {feedback.text}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
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
};

export default BalletCamera;

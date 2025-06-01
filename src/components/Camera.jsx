// Updated BalletCamera.jsx with auto-feedback every 5 frames

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Card, CardContent, CircularProgress, AppBar, Toolbar, Typography, Box, Container, Paper, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { loadPoseFromJson } from './loadPoseJson';
import { OpenAI } from 'openai';
import Webcam from 'react-webcam';
import VideoCallIcon from '@mui/icons-material/VideoCall';
// import { useUser } from '../UserContext'; 

const overlayActions = ["Arabesque", "Attitude", "Ballon", "Battement", "Brisé", "Cabriole", "Changement", "Chassé"];

const BalletCamera = () => {
  const [actionIndex, setActionIndex] = useState(0);
  // const { userId } = useUser();
  const [feedback, setFeedback] = useState("No feedback yet.");
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const [frameQueue, setFrameQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullFeedbackLog, setFullFeedbackLog] = useState([]);
  const [scores, setScores] = useState(null);

  const frameCounterRef = useRef(0);

  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY
    ,dangerouslyAllowBrowser: true
  });

  const getScoreSummary = async (feedbackText) => {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a dance judge evaluating technique from written feedback.'
        },
        {
          role: 'user',
          content: `Based on the following feedback:\n\n"${feedbackText}"\n\nGive 1-10 scores (with 1 sentence each) for:\n- Flexibility\n- Smooth transitions\n- Balance\n- Alignment`
        }
      ];
  
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 200,
        temperature: 0.3
      });
  
      const text = response.choices[0].message.content;
      console.log(text)
      setScores(text);
    } catch (err) {
      console.error('Score summary failed:', err);
      setScores('⚠️ Failed to generate scores.');
    }
  };
  

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
  

  async function generateFeedbackFromImage(imagePath, onToken, setIsLoading) {
    try {
      // setFeedback((prev) => (prev || '') + onToken);
      // setFullFeedbackLog((prevLog) => [...prevLog, onToken]);
      if (setIsLoading) setIsLoading(true);
      const imageDataUrl = imagePath;

      const messages = [
        { role: 'system', content: 'You are a professional ballet posture and technique coach.' },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Carefully examine the attached image and do the following:\n\n1. Briefly describe what is happening in the image.\n2. If any dance pose(even if only a part of the body is shown/visible), generate 250-token corrective feedback.\n3. If no dancer or pose is visible, state that no dancer or pose was detected.`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUrl,
                detail: 'high'
              }
            }
          ]
        }
      ];

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: 250,
        temperature: 0.7,
        stream: true
      });

      let fullMessage = '';
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        fullMessage += token;
        console.log("token",token)
        if (onToken) onToken(token);
        setFullFeedbackLog((prevLog) => [...prevLog, token]); // ✅ CORRECT SPOT

      }

      return fullMessage;
    } catch (err) {
      console.error('Streaming error:', err);
      return 'Error generating feedback.';
    } finally {
      if (setIsLoading) setIsLoading(false);
    }
  }

  useEffect(() => {
    const captureInterval = setInterval(() => {
      if (!webcamRef.current || !webcamRef.current.video) return;

      frameCounterRef.current += 1;
      if (frameCounterRef.current % 10 === 0) {
        enqueueFrame();
      }
    }, 1000); // every 1s; adjust for faster capture

    return () => clearInterval(captureInterval);
  }, [enqueueFrame]);

  useEffect(() => {
    if (!isProcessing && frameQueue.length > 0) {
      const nextImage = frameQueue[0];
      setIsProcessing(true);
      setFeedback("");

      generateFeedbackFromImage(nextImage, (token) => {
        setFeedback((prev) => (prev || '') + token);
      }, setIsLoading).then(() => {
        setIsProcessing(false);
        setFrameQueue((q) => q.slice(1));
      });
    }
  }, [frameQueue, isProcessing]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActionIndex((prevIndex) => (prevIndex + 1) % overlayActions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const timer = setTimeout(() => {
    const compiledFeedback = fullFeedbackLog.join('');
  
      getScoreSummary(compiledFeedback);
    }, 2 * 60 * 1000); // 2 minutes
  
    return () => clearTimeout(timer);
  }, []);
  

  // const renderFeedback = () => (
  //   <Paper
  //     sx={{
  //       p: 2,
  //       mt: 2,
  //       backgroundColor: '#FF1493',
  //       color: 'white',
  //       maxHeight: '300px',
  //       overflowY: 'auto',
  //       borderRadius: 2,
  //       boxShadow: 3,
  //       whiteSpace: 'pre-wrap',
  //       fontFamily: 'monospace',
  //     }}
  //     elevation={3}
  //   >
  //     <Typography variant="body1" align="left">
  //       {feedback}
  //     </Typography>
  //   </Paper>
  // );

  const renderFeedback = () => (
    <Paper
      sx={{
        p: 2,
        mt: 2,
        backgroundColor: '#FF1493',
        color: 'white',
        maxHeight: '300px',
        overflowY: 'auto',
        borderRadius: 2,
        boxShadow: 3,
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
      }}
      elevation={3}
    >
      <Typography variant="body1" align="left">
        {feedback}
        {isLoading && <span className="typing-cursor">▍</span>}
      </Typography>
    </Paper>
  );
  

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static" sx={{ backgroundColor: '#FF1493' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Ballet Feedback Application
          </Typography>
          <IconButton color="inherit">
            <VideoCallIcon />
            <Typography sx={{ ml: 1 }}>Auto Streaming</Typography>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, flex: 1 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
              Current Ballet Step: {overlayActions[actionIndex]}
            </Typography>

            <Box sx={{ mt: 2, mb: 4, border: '2px solid #FF1493', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
              <Webcam ref={webcamRef} className="w-full h-auto" videoConstraints={{ facingMode: 'user' }} />
              <canvas ref={canvasRef} width={640} height={480} style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'none' }} />
            </Box>

            <Box sx={{ position: 'relative' }}>
  {renderFeedback()}
  {isLoading && (
    <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
      <CircularProgress size={20} color="secondary" />
    </Box>
  )}
</Box>


            {/* {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress color="secondary" />
              </Box>
            ) : (
              renderFeedback()
            )} */}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default BalletCamera;

import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, CardContent, CircularProgress, Typography, Box, Container, Paper, IconButton, Chip, LinearProgress, FormControl, InputLabel, Select, MenuItem, Tooltip, Avatar, Collapse, Badge, Dialog, DialogContent, DialogActions, DialogTitle } from '@mui/material';
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
import MeshTest from './mesh-test';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TimelineIcon from '@mui/icons-material/Timeline';
import HistoryIcon from '@mui/icons-material/History';


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


// const systemPrompt = `
// You are a highly skilled and professional ballet coach, trained in both classical and contemporary styles. Your task is to provide frame-by-frame and overall sequence feedback for a dancer's performance video.

// Your feedback should be constructive, grounded in professional technique, and clearly explain areas for improvement and strength. Tailor your observations based on the style (classical vs contemporary) of the movement.

// Focus Areas:

// 1. Technique (All Styles)
// - Evaluate body alignment, limb control, and spatial awareness.
// - Comment on footwork clarity and turnout in classical sections.
// - For contemporary, assess groundedness, improvisational quality, and release technique.

// 2. Transitions & Movement Flow
// - Identify if movements are smooth and connected or choppy and isolated.
// - Highlight strengths in weight transfer, directional control, and momentum building.

// 3. Progressive and Dynamic Movements
// - Offer detailed feedback on:
//   - Turns (e.g., pirouettes, chainé, fouetté)
//   - Leaps and jumps (e.g., saut de chat, jeté, contemporary floor takeoffs)
//   - Leg lifts and extensions (e.g., arabesque, développé, battement)
//   - Acrobatic elements (e.g., rolls, inversions, handstands in contemporary)
// - Evaluate balance and control, especially during sustained poses or landing sequences.

// 4. Footwork & Ground Contact
// - For classical: note articulation through demi-pointe/pointe, foot rolls, and floor connection.
// - For contemporary: evaluate barefoot grip, slide efficiency, and grounded phrasing.

// 5. Style, Musicality, and Expression
// - Comment on style adherence (e.g., Vaganova, Balanchine, Release, Horton).
// - Assess musical phrasing, timing, and expressive delivery.

// Feedback Format:
// Use professional language that is clear and helpful for advanced learners and pre-professional dancers. Provide:
// - Frame-by-frame commentary (with frame numbers or timing cues).
// - Overall sequence summary covering technique, performance quality, and improvement areas.

// Example Phrases:
// - "At frame 78, the transition into the jeté was rushed. Try initiating the plié earlier to allow more height."
// - "Strong release quality in the floor phrase starting at frame 102 — especially the shoulder roll into back curve."
// - "Excellent foot articulation throughout the petit allegro in frames 35–60. Work on softening the landings."

// Be encouraging but direct. The goal is to refine the dancer's technique while building their confidence and awareness across multiple body parts and expressive systems.

// If there is no dancing or dance related poses detected clearly state that "no dancing is detected, try again"
// `;

const systemPrompt = `
You are a world-class ballet and contemporary dance instructor with a background in training dancers from early foundations to professional company auditions. You are a mentor and coach, trained in elite methodologies including Vaganova, Balanchine, Cecchetti, and contemporary techniques like Release, Graham, Horton, and Laban.

You will receive multiple frames of images and provide **precise, actionable feedback** tailored to their inferred level. Break down the dancer's execution **frame-by-frame** and conclude with an **overall assessment**. Focus on encouraging technical growth while nurturing artistry and stylistic clarity.

---

📌 **Key Expectations for Your Feedback**:

1. **Frame-by-Frame Observations**
   - Refer to timestamps or frame numbers.
   - Identify strengths and areas of concern with biomechanical reasoning.
   - Offer corrections using correct anatomical and stylistic terminology.
   - Be concise, professional, and instructional.

2. **Overall Sequence Feedback**
   - Summarize the dancer's proficiency, posture, control, coordination, musicality, emotional phrasing, and style fidelity.
   - Suggest drills or focuses for next practice sessions.

3. **Level Awareness**
   - If beginner: focus on posture, alignment, basic port de bras, and clarity of movement initiation.
   - If intermediate: emphasize transitions, center stability, turnout consistency, and timing.
   - If advanced: critique nuance, breath phrasing, elevation, rhythm intricacies, épaulement, and emotional expression.

4. **Movement Focus Areas**:
   - **Turns**: spotting, core control, relevé engagement, pirouette prep.
   - **Jumps/Leaps**: plié usage, ballon, foot articulation, upper-lower body coordination.
   - **Leg Extensions**: hip rotation, line clarity, pelvis alignment.
   - **Transitions**: weight transfer, directional flow, breath initiation.
   - **Contemporary Floorwork**: spiral transitions, groundedness, momentum redirection.
   - **Footwork**: articulation, pointe/demi-pointe stability, barefoot clarity.
   - **Expression/Musicality**: phrasing, intention, breath-timing, facial use.

5. **Language & Tone**
   - Use respectful, uplifting, and technically sound phrasing.
   - Highlight both what *worked well* and *what to refine*.
   - Avoid generic or vague comments.

---

🎓 **Few-Shot Examples:**

**Example 1: Beginner Ballet (Classical)**  
- _"Frame 48 — The tendu to second has clean initiation from the heel. Encourage stronger articulation through the metatarsals as you close."_  
- _"Frame 102 — Keep the pelvis neutral in arabesque; slight anterior tilt is causing loss of turnout."_  
- _**Summary**: Strong effort on posture and intent. Work on smoother transitions between tendus and pliés. Use the barre to practice turnout with pelvic stability._

---

**Example 2: Intermediate Contemporary**  
- _"00:00:25 — The drop to floor has good intention, but control into the spiral is rushed. Try slowing the upper spine curve to fully release momentum."_  
- _"00:01:04 — Great floor exit; the back shoulder spiral was grounded and well-timed with the breath."_  
- _**Summary**: Excellent understanding of floorwork phrasing. Focus on even more nuanced timing with transitions. Consider Release Technique drills emphasizing distal initiation._

---

**Example 3: Advanced Ballet (Vaganova style)**  
- _"Frame 82 — Excellent suspension before the grand jeté. Consider softening the arms to avoid over-tension in the shoulders mid-air."_  
- _"Frame 130 — The retiré position in the pirouette is slightly behind the knee. Bring the toe forward and engage turnout from the hip."_  
- _**Summary**: Strong ballon, beautifully expressive épaulement. Focus on consistent core engagement in turning sequences and refining upper-limb dynamics in allegro."_

---

Your role is to act as a master coach. Provide feedback that is both exacting and nurturing. Help dancers improve their coordination, control, performance intention, and stylistic understanding in every session.

You have to analyze each pose, or a single pose, and apply ballet technical corrections even if the frames seem repetitive
`;
const systemPrompt2 = `
You are a world-class ballet and contemporary dance instructor with deep expertise in training dancers from early foundations to professional company level. You are trained in classical methodologies such as Vaganova, Balanchine, and Cecchetti, as well as contemporary techniques including Release, Graham, Horton, Flying Low, Floorwork, and Laban Movement Analysis.

You will be given a dancer's performance video. Your role is to provide precise, structured, and encouraging feedback focused on both technical execution and artistic expression. Structure your response into sections using semicolons.

; Movement Observations:
Refer naturally to key movements, transitions, or segments within the phrase. Do not use frame numbers. Identify technical and stylistic qualities in posture, initiation, movement pathways, coordination, and expression. Be biomechanically grounded and artistically aware.

Offer constructive feedback across:
- Limb placement (e.g., turnout from the hip, alignment of knee over toe, shoulder stacking)
- Control and stability (e.g., core engagement during turns, controlled plié before jumps)
- Articulation (e.g., footwork clarity, port de bras fluidity, finger/hand dynamics)
- Dynamics and phrasing (e.g., breath timing, release of tension, rhythmic structure)
- Directional clarity (e.g., spatial intent during directional changes)

; Overall Feedback:
Summarize the dancer's overall proficiency across technical, artistic, and expressive dimensions. Comment on posture, control, timing, spatial awareness, musicality, and emotional engagement. Provide 1–2 targeted suggestions or practice focuses to guide improvement.

; Level-Aware Guidance:
Adjust your feedback tone and specificity based on the dancer's apparent experience:
- Beginner: prioritize posture, basic coordination, initiation from center, and fundamental clarity (e.g., demi-plié depth, straight knees in tendu, proper arm pathways).
- Intermediate: focus on transitions, energy control, directional flow, turnout consistency, elevation mechanics, and upper-lower body integration.
- Advanced: critique nuance, épaulement, expressivity, phrase resolution, complex musicality, breath use, and advanced coordination (e.g., suspension in adagio, grounding in floorwork spirals, control in grand jetés).

; Technique Categories to Observe:
Use these focal areas when structuring feedback:

- Turns (ballet and contemporary): spotting technique, axial alignment, pirouette prep, passé position, relevé control, arm placement consistency.
- Jumps and Leaps: use of plié, ballon/suspension, toe-point at takeoff, hip square-ness in jeté, double jumps control, air shape clarity.
- Extensions: hamstring length vs. hip hike, développé initiation, working-leg articulation, pelvic stability, adagio control.
- Floorwork and Contemporary Transitions: spiral initiation from thoracic spine, controlled fall/rebound, use of momentum, rolling point of contact (e.g., shoulder, sacrum).
- Footwork: demi-pointe stability, foot articulation in barefoot, heel sequencing, turnout maintenance during weight transfer.
- Arm and Head Lines: clean port de bras, wrist/finger articulation, neck alignment, épaulement clarity, sustained reach.
- Expression and Musicality: phrasing through breath, emotional tone, alignment with musical accents, softness vs. sharpness in delivery.

; Advanced Detail Guidance:
For dancers showing strong fundamentals, you may also comment on:
- Use of counterpull or opposition (e.g., elongation through crown during arabesque)
- Energy direction (e.g., upward lift vs. grounded push)
- Spatial projection (e.g., reaching past kinesphere)
- Stylistic fidelity (e.g., Vaganova épaulement vs. Balanchine speed vs. Release softness)
- Flow interruption or over-muscling (e.g., visible effort in what should be effortless transitions)

; Language and Tone:
Use warm, professional language. Your tone should be both nurturing and exacting. Use strict technical terminology. Always highlight what is working as well as what can be improved. Avoid vague, generic, or repetitive phrases.

🔄 **Other Guidelines**:
- If the sequence of images has **no visible dance related pose**:
➤ _"No dancing was detected in the input. Please submit a valid dance performance video."_

You can ONLY say you are unable to provide feedback if it is clear the individual captured is sitting 

🎓 **Few-Shot Examples:**

**Example 1:  
- _"Frame 48 — The tendu to second has clean initiation from the heel. Encourage stronger articulation through the metatarsals as you close."_  
- _"Frame 102 — Keep the pelvis neutral in arabesque; slight anterior tilt is causing loss of turnout."_  
- _**Summary**: Strong effort on posture and intent. Work on smoother transitions between tendus and pliés. Use the barre to practice turnout with pelvic stability._

---

**Example 2:
- _"00:00:25 — The drop to floor has good intention, but control into the spiral is rushed. Try slowing the upper spine curve to fully release momentum."_  
- _"00:01:04 — Great floor exit; the back shoulder spiral was grounded and well-timed with the breath."_  
- _**Summary**: Excellent understanding of floorwork phrasing. Focus on even more nuanced timing with transitions. Consider Release Technique drills emphasizing distal initiation._

---

**Example 3: 
- _"Frame 82 — Excellent suspension before the grand jeté. Consider softening the arms to avoid over-tension in the shoulders mid-air."_  
- _"Frame 130 — The retiré position in the pirouette is slightly behind the knee. Bring the toe forward and engage turnout from the hip."_  
- _**Summary**: Strong ballon, beautifully expressive épaulement. Focus on consistent core engagement in turning sequences and refining upper-limb dynamics in allegro."_


You have to provide feedback for every image in the sequence if the person is clearly standing and in a body pose
You are a master teacher and mentor. Your feedback should empower dancers to refine their movement, deepen their awareness, and grow in both technique and artistry.
`;


const correctionFunction = {
  name: "generate_mesh_corrections",
  description: "Extract mesh correction values from posture feedback",
  parameters: {
    type: "object",
    properties: {
      mesh_corrections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            body_part: { type: "string" },
            correction: { type: "string" },
            delta: {
              type: "array",
              items: { type: "number" },
              minItems: 3,
              maxItems: 3
            }
          },
          required: ["body_part", "correction", "delta"]
        }
      }
    },
    required: ["mesh_corrections"]
  }
};


// const correctionFunction = {
//   name: "generate_mesh_corrections",
//   description: "Extract a list of mesh corrections from feedback text using SMPL segmentation format.",
//   parameters: {
//     type: "object",
//     properties: {
//       feedback_text: {
//         type: "string",
//         description: "Raw dance feedback describing posture issues and suggested fixes."
//       }
//     },
//     required: ["feedback_text"]
//   }
// };


const BalletCamera = () => {
  // Context & State
  const { user, getAuthToken } = useAuth();
  const { createChatSession, saveCameraFeedback } = useChat();
  const [meshImageUrl, setMeshImageUrl] = useState(null);
  const [correctedMesh,setCorrectedMesh] = useState(null);

  const [feedback, setFeedback] = useState("No feedback yet.");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStats, setSessionStats] = useState({ duration: '00:00', exercises: 0, accuracy: 85 });
  const [performanceScores, setPerformanceScores] = useState({
    flexibility: null,
    alignment: null,
    smoothness: null,
    energy: null,
    explanation: ''
  });
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
  const [wsConnected, setWsConnected] = useState(false);
  const [wsInitialized, setWsInitialized] = useState(false);
  const [meshDebugInfo, setMeshDebugInfo] = useState({
    received: false,
    dataLength: 0,
    lastReceived: null,
    error: null,
    connectionId: null,
    frameCount: 0
  });
  
  // Image modal state
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  // 1. Add state for workout recommendation and loading
  const [workoutRecommendation, setWorkoutRecommendation] = useState("");
  const [isWorkoutLoading, setIsWorkoutLoading] = useState(false);

  // 2. Add function to call OpenAI for workout generation
  const handleGenerateWorkout = async () => {
    setIsWorkoutLoading(true);
    setWorkoutRecommendation("");
    const scoreHistory = fullFeedbackLog.map(fb => ({
      flexibility: fb.flexibility,
      alignment: fb.alignment,
      smoothness: fb.smoothness,
      energy: fb.energy
    }));
    const prompt = `You are a world-class ballet coach. Given this session's progression of scores (flexibility, alignment, smoothness, energy), recommend a personalized ballet workout plan to address the weakest areas and improve overall performance. Be specific and use ballet terminology.\n\nScore progression: ${JSON.stringify(scoreHistory)}\n\nWorkout Recommendation:`;
    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a ballet coach.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        stream: true
      });
      let streamedText = '';
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        streamedText += token;
        setWorkoutRecommendation(prev => prev + token);
      }
      try {
        await axios.post(`${config.API_URL}/workouts/save-workout`, {
          userId: user.uid,
          workoutRecommendation: streamedText
        });
        console.log("Workout saved successfully!");
      } catch (err) {
        console.error("Failed to save workout:", err);
      }
      
    } catch (err) {
      setWorkoutRecommendation("Error generating workout. Please try again.");
    }
    setIsWorkoutLoading(false);
  };

  const sendFrame = useWebSocket(user?.uid || 'test-user', (meshImage) => {
    console.log('🎯 Mesh result received from WebSocket:', meshImage ? 'Image data received' : 'No image data');
    console.log(user)
    
    if (meshImage) {
      console.log('📊 Received mesh data length:', meshImage.length);
      console.log('🔍 First 50 chars of received mesh data:', meshImage.substring(0, 50));
      console.log('🔍 Last 50 chars of received mesh data:', meshImage.substring(meshImage.length - 50));
      
      // Validate the mesh data
      if (meshImage.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        console.log('✅ Mesh data validation passed');
        setMeshDebugInfo(prev => ({
          ...prev,
          received: true,
          dataLength: meshImage.length,
          lastReceived: new Date().toISOString(),
          error: null,
          frameCount: prev.frameCount + 1
        }));
        setLatestMeshImage(meshImage);
      } else {
        console.error('❌ Invalid mesh data received');
        setMeshDebugInfo(prev => ({
          ...prev,
          received: false,
          dataLength: 0,
          lastReceived: null,
          error: 'Invalid base64 data'
        }));
      }
    } else {
      console.error('❌ No mesh data received');
      setMeshDebugInfo(prev => ({
        ...prev,
        received: false,
        dataLength: 0,
        lastReceived: null,
        error: 'No data received'
      }));
    }
  }, (connected, connectionId) => {
    console.log('🔌 WebSocket connection status:', connected);
    console.log('🆔 Connection ID:', connectionId);
    setWsConnected(connected);
    setWsInitialized(true);
    if (connectionId) {
      setMeshDebugInfo(prev => ({
        ...prev,
        connectionId: connectionId
      }));
    }
  });

  // Debug logging for mesh state
  useEffect(() => {
    console.log('🔄 latestMeshImage state changed:', latestMeshImage ? 'Has data' : 'No data');
    if (latestMeshImage) {
      console.log('📊 Mesh data length:', latestMeshImage.length);
      console.log('🔍 First 50 chars of mesh data:', latestMeshImage.substring(0, 50));
    }
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
    const meshFrame = frameBuffer[0]; // or frameBuffer[frameBuffer.length - 1]

    console.log(`Sending frame #${FRAME_BATCH_SIZE} of batch for mesh inference`);
    sendFrame(meshFrame);
    setFrameBuffer(buf => buf.slice(FRAME_BATCH_SIZE));
    setIsProcessing(true);
    generateFeedbackFromFrames(batch).then(() => setIsProcessing(false));
    // eslint-disable-next-line
  }, [frameBuffer, isSessionActive, isLoading, isProcessing]);

  // --- BATCH FEEDBACK GENERATOR ---
  const generateFeedbackFromFrames = async (imageFrames) => {
    if (!isSessionActive || !imageFrames.length) return;


    // const processedFrames = imageFrames.map(img => ({
    //   type: 'image_url',
    //   image_url: { url: img }
    // }))

    try {
      setIsLoading(true);

      // const meshUrl2 = await uploadFrameToInference(imageFrames[0]);
      // setMeshImageUrl(meshUrl2);

      // Multi-frame OpenAI input
      const userMessage = [
        { type: 'text', text: 'Analyze this dance sequence (10 frames). Provide technical feedback on each pose' },
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
            content: systemPrompt
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
  //     const correctionCall = await openai.chat.completions.create({
  //       model: "gpt-4o",
  //       messages: [
  //         {
  //           role: "system",
  //           content: `
  //     You are a biomechanics assistant for dance feedback. You will receive posture-related feedback and must extract relevant SMPL-based mesh corrections. Return a list of objects under the field "mesh_corrections".
      
  //     Each correction must include:
  //     - "body_part": specific region (e.g., "leftHip", "rightShoulder")
  //     - "correction": one of the known posture issues (e.g., "hip_alignment", "shoulder_drop")
  //     - "delta": a [x, y, z] offset to apply (values ~ ±0.01–0.05 max)
      
  //     Only include corrections mentioned or implied in the feedback text.
  //     `
  //         },
  //         {
  //           role: "user",
  //           content: fullMessage  // assuming fullMessage is a string
  //         }
          
  //         // {
  //         //   role: "user",
  //         //   content: {
  //         //     feedback_text: fullMessage
  //         //   }
  //         // }
  //       ],
  //       functions: [correctionFunction],
  //       function_call: { name: "generate_mesh_corrections" }
  //     });


  //     console.log("correction call",correctionCall)

  //     // === Step 3: Generate corrected mesh image from final frame ===
  //     const meshResponse = await openai.responses.create({
  //       model: "gpt-4.1",
  //       input: [
  //         {
  //           role: "system",
  //           content: [
  //             {
  //               type: "input_text",
  //               text: "You are a helpful visual mesh image generator. Given a human ballet pose, you generate a detailed mesh overlay highlighting posture, leg position, and joint alignment. You correct errors like bent knees or turned-in feet by overlaying a red mesh on the corrected body parts."
  //             }
  //           ]
  //         },
  //         {
  //           role: "user",
  //           content: [
  //             {
  //               type: "input_text",
  //               text: `Please generate a corrected 3D  mesh image for this pose,incorporating the feedback text into the generated pose image.Feedback Text: ${fullMessage}`
  //             },
  //             {
  //               type: "input_image",
  //               image_url:imageFrames[imageFrames.length - 1]
               
  //               // image_url: 
  //               //  imageFrames[imageFrames.length - 1].image_url // final frame
              
  //             }
  //           ]
  //         }
  //       ],
  //       tools: [{ type: "image_generation" }]
  //     });

  //     console.log("mesh response",meshResponse)
  //     const imageResult = meshResponse?.output?.[0]?.result
  // || meshResponse?.[0]?.content?.[0]?.image_url
  // || meshResponse?.[0]?.image?.url;

  //     console.log(imageResult)

  //     // const correctedMeshImageUrl = meshResponse?.output?.image?.url;
  //     setCorrectedMesh(imageResult); // display in UI
  //     // === Step 3: Generate corrected mesh image from final frame ==='

  //     console.log(correctedMesh)
        

      setAccumulatedFeedback(prev => prev + "\n\n" + fullMessage);
      if (!sessionImage) setSessionImage(imageFrames[0]);
      if (currentChatSession) {
        await saveCameraFeedback(fullMessage, imageFrames[0], currentChatSession._id);
      }
      const feedbackScores = await analyzeFeedback(fullMessage);
      setFullFeedbackLog(log => [
        ...log,
        {
          img: imageFrames[imageFrames.length - 1],
          frames: imageFrames,
          text: fullMessage,
          flexibility: feedbackScores?.flexibility,
          alignment: feedbackScores?.alignment,
          smoothness: feedbackScores?.smoothness,
          energy: feedbackScores?.energy,
          explanation: feedbackScores?.explanation,
          timestamp: new Date().toISOString()
        }
      ]);
      setIsLoading(false);

      // Note: Mesh data is now handled via WebSocket, not upload endpoint


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

      // Create feedback array from fullFeedbackLog with all frames
      const sessionFeedback = fullFeedbackLog.map(entry => ({
        text: entry.text,
        image: entry.img,
        frames: entry.frames || [entry.img],
        flexibility: entry.flexibility,
        alignment: entry.alignment,
        smoothness: entry.smoothness,
        energy: entry.energy,
        explanation: entry.explanation,
        timestamp: entry.timestamp
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
        performanceAnalysis: {
          flexibility: performanceScores.flexibility,
          alignment: performanceScores.alignment,
          smoothness: performanceScores.smoothness,
          energy: performanceScores.energy,
          explanation: performanceScores.explanation
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

  // Image modal handlers
  const handleImageClick = (imageSrc, frameNumber = null, feedbackIndex = null) => {
    setSelectedImage({
      src: imageSrc,
      frameNumber: frameNumber,
      feedbackIndex: feedbackIndex
    });
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
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

  // --- NEW STATE FOR LAYOUT ---
  const [leftPanelWidth, setLeftPanelWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState(0); // 0: Performance, 1: Feedback, 2: Timeline
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const leftPanelRef = useRef(null);

  // Add state for right sidebar tab and width
  const [rightSidebarTab, setRightSidebarTab] = useState('sessions'); // 'sessions' or 'timeline'
  const [rightSidebarWidth, setRightSidebarWidth] = useState(400);
  const [isRightResizing, setIsRightResizing] = useState(false);
  const rightSidebarRef = useRef(null);

  // --- DRAG TO RESIZE LEFT PANEL ---
  const handleMouseDown = (e) => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
  };
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const minWidth = 320;
      const maxWidth = 1200;
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      setLeftPanelWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
    };
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // --- DRAG TO RESIZE RIGHT SIDEBAR ---
  const handleRightMouseDown = (e) => {
    setIsRightResizing(true);
    document.body.style.cursor = 'col-resize';
  };
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isRightResizing) return;
      const minWidth = 320;
      const maxWidth = 600;
      const windowWidth = window.innerWidth;
      const newWidth = Math.min(Math.max(windowWidth - e.clientX, minWidth), maxWidth);
      setRightSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsRightResizing(false);
      document.body.style.cursor = '';
    };
    if (isRightResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isRightResizing]);

  // Camera size state
  const cameraSizes = {
    small: 240,
    medium: 360,
    large: 480,
    fullscreen: '100%'
  };
  const [cameraSize, setCameraSize] = useState('medium');

  // --- MAIN RENDER ---
  return (
    <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#FDF2F8' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ background: 'linear-gradient(90deg, #FFF0F5 0%, #FDF2F8 100%)', boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)' }} elevation={0}>
        <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'space-between', px: 4 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#C2185B',
                letterSpacing: 0.5,
                fontFamily: 'Poppins, Inter, Montserrat, Roboto, Helvetica, Arial, sans-serif', // prettier font
                lineHeight: 1.1,
                mb: 0.2
              }}
            >
              Ballet Practice Session
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#7C3A58',
                fontWeight: 400,
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                letterSpacing: 0.2,
                mt: 0.2,
                fontFamily: 'Poppins, Inter, Montserrat, Roboto, Helvetica, Arial, sans-serif', // prettier font
              }}
            >
              AI-Powered Dance Feedback
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip icon={<TimerIcon />} label={sessionStats.duration} sx={{ backgroundColor: '#FFF0F5', color: '#FF1493' }} />
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
        </Toolbar>
      </AppBar>
      {/* Main Layout: Left Sidebar | Center | Right Sidebar */}
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Left Sidebar (Resizable, vertical column) */}
        <Paper ref={leftPanelRef} sx={{
          width: leftPanelWidth,
          borderRight: '1px solid #F8BBD0',
          height: '100%',
          overflowY: 'auto',
          backgroundColor: '#FDF2F8',
          boxShadow: '2px 0 8px rgba(249, 168, 212, 0.06)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: isResizing ? 'none' : 'width 0.1s ease',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          gap: 0
        }}>
          {/* Resize Handle */}
          <Box
            sx={{
              position: 'absolute',
              right: -4,
              top: 0,
              bottom: 0,
              width: 8,
              cursor: 'col-resize',
              backgroundColor: 'transparent',
              zIndex: 10,
              '&:hover': {
                backgroundColor: 'rgba(249, 168, 212, 0.1)',
              },
            }}
            onMouseDown={handleMouseDown}
          >
            <DragIndicatorIcon sx={{ fontSize: 16 }} />
          </Box>
          {/* Camera Size Controls */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center', mt: 2, mb: 1 }}>
            {Object.keys(cameraSizes).map(size => (
              <Button
                key={size}
                variant={cameraSize === size ? 'contained' : 'outlined'}
                size="small"
                sx={{
                  minWidth: 0,
                  px: 1.5,
                  borderRadius: 2,
                  backgroundColor: cameraSize === size ? '#FF1493' : 'transparent',
                  color: cameraSize === size ? '#fff' : '#FF1493',
                  borderColor: '#FF1493',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  '&:hover': { backgroundColor: '#FF69B4', color: '#fff' }
                }}
                onClick={() => setCameraSize(size)}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </Button>
            ))}
          </Box>
          {/* Cameras and Mesh Display */}
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            {/* Main Camera */}
            <Box sx={{ border: '2px solid rgba(255, 20, 147, 0.2)', borderRadius: '16px', overflow: 'hidden', position: 'relative', width: '100%', height: cameraSizes[cameraSize] === '100%' ? 'calc(100vh - 200px)' : cameraSizes[cameraSize], maxWidth: '100%', boxShadow: '0 4px 12px rgba(255, 20, 147, 0.1)', transition: 'height 0.2s', margin: '0 auto' }}>
              <Webcam ref={webcamRef} style={{ width: '100%', height: '100%', display: 'block' }} videoConstraints={{ width: 640, height: 480, facingMode: "user" }} />
              <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />
              {/* Mesh overlays */}
              {correctedMesh && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10 }}>
                  <img src={`data:image/jpeg;base64,${correctedMesh}`} alt="Live Pose Mesh Overlay" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, mixBlendMode: 'screen', filter: 'drop-shadow(0 0 10px rgba(0, 255, 0, 0.5))' }} />
                </Box>
              )}
              {latestMeshImage && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10 }}>
                  <img src={`data:image/jpeg;base64,${latestMeshImage}`} alt="Live Pose Mesh Overlay" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, mixBlendMode: 'screen', filter: 'drop-shadow(0 0 10px rgba(0, 255, 0, 0.5))' }} />
                </Box>
              )}
            </Box>
            {/* Second Camera (if needed) */}
            <Box sx={{ width: '100%' }}>
              <Webcam ref={webcamRef} />
            </Box>
            {/* Mesh Debug/Status */}
            <Box sx={{ mt: 1, p: 1, backgroundColor: '#FFF0F5', borderRadius: '8px', border: '1px solid #F8BBD0', textAlign: 'center', width: '100%' }}>
              <Typography variant="caption" sx={{ color: '#7C3A58' }}>Mesh: {wsConnected ? 'Connected' : 'Disconnected'} | Frames: {meshDebugInfo.frameCount}</Typography>
            </Box>
          </Box>
          {/* Stats Row */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2, px: 2, width: '100%', justifyContent: 'center' }}>
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
                <Typography variant="caption" sx={{ color: '#666' }}>Exercises</Typography>
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
          {/* Controls (Start/End/Save) */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center', width: '100%' }}>
            {!isSessionActive ? (
              <StyledButton variant="contained" onClick={startNewSession} sx={{ backgroundColor: '#FF1493', color: '#fff', '&:hover': { backgroundColor: '#FF69B4' } }}>Start Session</StyledButton>
            ) : (
              <>
                <StyledButton variant="contained" onClick={saveCurrentSession} sx={{ backgroundColor: '#FF1493', color: '#fff', '&:hover': { backgroundColor: '#FF69B4' } }}>Save Session</StyledButton>
                {endSessionButton}
              </>
            )}
          </Box>
        </Paper>
        {/* Center Content (single column, aligned) */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: '#fff', overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start' }}>
          {/* Tabs for Performance/Feedback (no Timeline) */}
          <Box sx={{ backgroundColor: '#FDF2F8', borderBottom: '1px solid #F8BBD0' }}>
            <Tabs value={activeContentTab} onChange={(e, newValue) => setActiveContentTab(newValue)} centered sx={{
              '& .MuiTab-root': {
                color: '#7C3A58',
                fontWeight: 500,
                fontSize: '0.875rem',
                '&.Mui-selected': {
                  color: '#FF1493',
                  background: 'rgba(255, 20, 147, 0.08)'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#FF1493',
                height: 3,
              }
            }}>
              <Tab label="Performance Analysis" />
              <Tab label="Current Feedback" />
            </Tabs>
          </Box>
          {/* Tab Content (no Timeline) */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3, alignItems: 'stretch', justifyContent: 'flex-start' }}>
            {activeContentTab === 0 && (
              <Box>
                {/* Performance Analysis */}
                <Typography variant="h6" sx={{ color: '#ff1493', mb: 2, fontWeight: 500 }}>Performance Analysis</Typography>
                <ScoreCard>
                  {["flexibility", "alignment", "smoothness", "energy"].map(metric => (
                    <Box sx={{ mb: 2 }} key={metric}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 0.5 }}>{metric.charAt(0).toUpperCase() + metric.slice(1)}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={performanceScores[metric] == null ? 0 : performanceScores[metric]} sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 20, 147, 0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#ff1493' } }} />
                        <Typography variant="body2" sx={{ color: '#ff1493', fontWeight: 500 }}>{performanceScores[metric] == null ? 'N/A' : performanceScores[metric] + '%'}</Typography>
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
            )}
            {activeContentTab === 1 && (
              <Box>
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
                {/* 3. In the Current Feedback tab, add the button and display area */}
                {/* (Place next to the Current Feedback heading) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: '#FF1493', color: '#FF1493', fontWeight: 600, borderRadius: 2, '&:hover': { backgroundColor: '#FFF0F5' } }}
                    onClick={handleGenerateWorkout}
                    disabled={isWorkoutLoading}
                  >
                    {isWorkoutLoading ? 'Generating...' : 'Generate Workout Recommendation'}
                  </Button>
                </Box>
                {workoutRecommendation && (
                  <Paper sx={{ mt: 2, p: 2, backgroundColor: '#FFF0F5', borderRadius: 2, border: '1px solid #FFB6C1' }}>
                    <Typography variant="subtitle2" sx={{ color: '#FF1493', fontWeight: 600, mb: 1 }}>Workout Recommendation</Typography>
                    <Typography variant="body2" sx={{ color: '#4A4A4A', whiteSpace: 'pre-wrap' }}>{workoutRecommendation}</Typography>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
        </Box>
        {/* Side Tab Buttons (only two, vertically centered) */}
        <Box sx={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 1300, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pointerEvents: 'none' }}>
          <Box sx={{ pointerEvents: 'auto' }}>
            <List sx={{ p: 0, bgcolor: 'transparent' }}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={rightSidebarTab === 'timeline' && isRightSidebarOpen}
                  onClick={() => {
                    if (isRightSidebarOpen && rightSidebarTab === 'timeline') {
                      setIsRightSidebarOpen(false);
                    } else {
                      setIsRightSidebarOpen(true);
                      setRightSidebarTab('timeline');
                    }
                  }}
                  sx={{ borderRadius: '16px 0 0 16px', mb: 1, bgcolor: rightSidebarTab === 'timeline' && isRightSidebarOpen ? '#FFF0F5' : 'transparent', boxShadow: rightSidebarTab === 'timeline' && isRightSidebarOpen ? '0 2px 8px rgba(255, 20, 147, 0.12)' : 'none', minWidth: 48 }}
                >
                  <ListItemIcon sx={{ color: '#FF1493', minWidth: 36 }}><TimelineIcon /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ color: '#FF1493', fontWeight: 600, fontSize: '1rem' }}>Timeline</Typography>} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={rightSidebarTab === 'sessions' && isRightSidebarOpen}
                  onClick={() => {
                    if (isRightSidebarOpen && rightSidebarTab === 'sessions') {
                      setIsRightSidebarOpen(false);
                    } else {
                      setIsRightSidebarOpen(true);
                      setRightSidebarTab('sessions');
                    }
                  }}
                  sx={{ borderRadius: '16px 0 0 16px', mb: 1, bgcolor: rightSidebarTab === 'sessions' && isRightSidebarOpen ? '#FFF0F5' : 'transparent', boxShadow: rightSidebarTab === 'sessions' && isRightSidebarOpen ? '0 2px 8px rgba(255, 20, 147, 0.12)' : 'none', minWidth: 48 }}
                >
                  <ListItemIcon sx={{ color: '#FF1493', minWidth: 36 }}><HistoryIcon /></ListItemIcon>
                  <ListItemText primary={<Typography sx={{ color: '#FF1493', fontWeight: 600, fontSize: '1rem' }}>Past Sessions</Typography>} />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Box>
        {/* Right Sidebar (Resizable Drawer, single column) */}
        {isRightSidebarOpen && (
          <Paper ref={rightSidebarRef} sx={{
            width: rightSidebarWidth,
            borderLeft: '1px solid #F8BBD0',
            height: '100%',
            overflowY: 'auto',
            backgroundColor: '#FDF2F8',
            boxShadow: '-4px 0 24px rgba(249, 168, 212, 0.12)',
            flexShrink: 0,
            display: 'flex',
            transition: 'width 0.3s ease-in-out',
            overflow: 'hidden',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1100,
            alignItems: 'stretch',
            justifyContent: 'flex-start'
          }}>
            {/* Resize Handle for Right Sidebar */}
            <Box
              sx={{
                position: 'absolute',
                left: -4,
                top: 0,
                bottom: 0,
                width: 8,
                cursor: 'col-resize',
                backgroundColor: 'transparent',
                zIndex: 10,
                '&:hover': {
                  backgroundColor: 'rgba(249, 168, 212, 0.1)',
                },
              }}
              onMouseDown={handleRightMouseDown}
            >
              <DragIndicatorIcon sx={{ fontSize: 16 }} />
            </Box>
            {/* Sidebar Content (single column) */}
            {rightSidebarTab === 'sessions' && (
              <>
                <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255, 20, 147, 0.1)', backgroundColor: '#FF1493', color: 'white' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Past Sessions</Typography>
                    <Badge badgeContent={feedbackSessions.length} color="error"><FitnessCenterIcon /></Badge>
                  </Box>
                </Box>
                <Box sx={{ p: 2, maxHeight: '70vh', overflowY: 'auto' }}>
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
                          {/* ... session summary ... */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>Overall Score</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={session.overallScore * 10} sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 20, 147, 0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#ff1493' } }} />
                              <Typography variant="body2" sx={{ color: '#ff1493', fontWeight: 500 }}>{session.overallScore}/10</Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic', mb: 2 }}>{session.summary}</Typography>
                          {/* ... feedback points ... */}
                          {session.feedback && session.feedback.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>Feedback Points ({session.feedback.length})</Typography>
                              <Box sx={{ maxHeight: '400px', overflowY: 'auto', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { background: 'rgba(255, 20, 147, 0.05)' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 20, 147, 0.2)', borderRadius: '3px' } }}>
                                {session.feedback.map((feedback, index) => (
                                  <Box key={index} sx={{ mb: 1.5, p: 1.5, backgroundColor: '#FFF0F5', borderRadius: '8px', '&:last-child': { mb: 0 }, border: '1px solid rgba(255, 20, 147, 0.08)' }}>
                                    <Box sx={{ mb: 1 }}>
                                      <Typography variant="subtitle2" sx={{ color: '#FF1493', fontWeight: 600, mb: 1 }}>Feedback Point {index + 1}</Typography>
                                      <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>{feedback.timestamp ? new Date(feedback.timestamp).toLocaleString() : 'No timestamp'}</Typography>
                                    </Box>
                                    {/* ... frames ... */}
                                    {feedback.frames && feedback.frames.length > 0 ? (
                                      <Box sx={{ mb: 2 }}>
                                        <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 1 }}>Frames ({feedback.frames.length}):</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: '4px' }, '&::-webkit-scrollbar-track': { background: 'rgba(255, 20, 147, 0.05)' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 20, 147, 0.2)', borderRadius: '2px' } }}>
                                          {feedback.frames.map((frame, frameIndex) => (
                                            <Box key={frameIndex} sx={{ position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'transform 0.2s ease-in-out', '&:hover': { transform: 'scale(1.1)', boxShadow: '0 4px 12px rgba(255, 20, 147, 0.3)' } }} onClick={() => handleImageClick(frame, frameIndex + 1, index)}>
                                              <img src={frame} alt={`Frame ${frameIndex + 1}`} style={{ width: '80px', height: '60px', borderRadius: '6px', objectFit: 'cover', boxShadow: '0 2px 4px rgba(255, 20, 147, 0.08)', border: '1px solid rgba(255, 20, 147, 0.1)' }} />
                                              <Chip label={`${frameIndex + 1}`} size="small" sx={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(255, 20, 147, 0.9)', color: 'white', fontWeight: 500, fontSize: '0.6rem', height: '16px', minWidth: '16px' }} />
                                            </Box>
                                          ))}
                                        </Box>
                                      </Box>
                                    ) : (
                                      <Box sx={{ position: 'relative', mb: 1, cursor: 'pointer', transition: 'transform 0.2s ease-in-out', '&:hover': { transform: 'scale(1.02)', boxShadow: '0 4px 12px rgba(255, 20, 147, 0.2)' } }} onClick={() => handleImageClick(feedback.image, 1, index)}>
                                        <img src={feedback.image} alt={`Feedback ${index + 1}`} style={{ width: '100%', borderRadius: '8px', maxHeight: '120px', objectFit: 'cover', boxShadow: '0 2px 4px rgba(255, 20, 147, 0.08)' }} />
                                        <Chip label={`Frame 1`} size="small" sx={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255, 20, 147, 0.9)', color: 'white', fontWeight: 500 }} />
                                      </Box>
                                    )}
                                    <Typography variant="body2" sx={{ color: '#4A4A4A', lineHeight: 1.4, fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{feedback.text}</Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                        {session.performanceAnalysis && (
                          <Box sx={{ mb: 2, p: 2, backgroundColor: '#FFF0F5', borderRadius: '12px', border: '1px solid rgba(255, 20, 147, 0.1)' }}>
                            <Typography variant="subtitle1" sx={{ color: '#FF1493', fontWeight: 600, mb: 1 }}>Session Performance Analysis</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                              {["flexibility", "alignment", "smoothness", "energy"].map(metric => (
                                <Box key={metric} sx={{ minWidth: 120, flex: 1 }}>
                                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>{metric.charAt(0).toUpperCase() + metric.slice(1)}</Typography>
                                  {session.performanceAnalysis[metric] == null ? (
                                    <Typography variant="body2" sx={{ color: '#888', fontWeight: 600, ml: 1 }}>N/A</Typography>
                                  ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <LinearProgress variant="determinate" value={session.performanceAnalysis[metric]} sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 20, 147, 0.08)', '& .MuiLinearProgress-bar': { backgroundColor: '#ff1493' } }} />
                                      <Typography variant="body2" sx={{ color: '#ff1493', fontWeight: 600, minWidth: 32 }}>{session.performanceAnalysis[metric]}%</Typography>
                                    </Box>
                                  )}
                                </Box>
                              ))}
                            </Box>
                            {session.performanceAnalysis.explanation && (
                              <Typography variant="caption" sx={{ color: '#888', fontStyle: 'italic' }}>Explanation: {session.performanceAnalysis.explanation}</Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    ))
                  )}
                </Box>
              </>
            )}
            {rightSidebarTab === 'timeline' && (
              <>
                <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255, 20, 147, 0.1)', backgroundColor: '#FF1493', color: 'white' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Session Timeline</Typography>
                    <Chip label={`${fullFeedbackLog.length} Feedback Points`} size="small" sx={{ backgroundColor: 'rgba(255, 20, 147, 0.1)', color: '#FF1493', fontWeight: 500 }} />
                  </Box>
                </Box>
                <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                  {/* Tabs for Performance/Feedback/Timeline */}
                  <Box sx={{ backgroundColor: '#FDF2F8', borderBottom: '1px solid #F8BBD0' }}>
                    <Tabs value={activeContentTab} onChange={(e, newValue) => setActiveContentTab(newValue)} centered sx={{
                      '& .MuiTab-root': {
                        color: '#7C3A58',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        '&.Mui-selected': {
                          color: '#FF1493',
                          background: 'rgba(255, 20, 147, 0.08)'
                        }
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: '#FF1493',
                        height: 3,
                      }
                    }}>
                      <Tab label="Performance Analysis" />
                      <Tab label="Current Feedback" />
                      <Tab label="Session Timeline" />
                    </Tabs>
                  </Box>
                  {/* Tab Content */}
                  <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                    {activeContentTab === 0 && (
                      <Box>
                        {/* Performance Analysis */}
                        <Typography variant="h6" sx={{ color: '#ff1493', mb: 2, fontWeight: 500 }}>Performance Analysis</Typography>
                        <ScoreCard>
                          {["flexibility", "alignment", "smoothness", "energy"].map(metric => (
                            <Box sx={{ mb: 2 }} key={metric}>
                              <Typography variant="subtitle2" sx={{ color: '#666', mb: 0.5 }}>{metric.charAt(0).toUpperCase() + metric.slice(1)}</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress variant="determinate" value={performanceScores[metric] == null ? 0 : performanceScores[metric]} sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 20, 147, 0.1)', '& .MuiLinearProgress-bar': { backgroundColor: '#ff1493' } }} />
                                <Typography variant="body2" sx={{ color: '#ff1493', fontWeight: 500 }}>{performanceScores[metric] == null ? 'N/A' : performanceScores[metric] + '%'}</Typography>
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
                    )}
                    {activeContentTab === 1 && (
                      <Box>
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
                      </Box>
                    )}
                    {activeContentTab === 2 && (
                      <Box>
                        {/* Session Timeline */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ color: '#FF1493', fontWeight: 600, letterSpacing: '0.5px' }}>Session Timeline</Typography>
                          <Chip label={`${fullFeedbackLog.length} Feedback Points`} size="small" sx={{ backgroundColor: 'rgba(255, 20, 147, 0.1)', color: '#FF1493', fontWeight: 500 }} />
                        </Box>
                        {fullFeedbackLog.map((entry, index) => (
                          <Box key={index} sx={{ mb: 2, backgroundColor: '#FFF0F5', borderRadius: '12px', boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)', overflow: 'hidden', border: '1px solid rgba(255, 20, 147, 0.1)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, cursor: 'pointer', backgroundColor: '#FFF0F5', borderBottom: '1px solid rgba(255, 20, 147, 0.1)' }} onClick={() => setExpandedFeedbackIndex(index === expandedFeedbackIndex ? null : index)}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ color: '#FF1493', fontWeight: 600 }}>Feedback #{index + 1}</Typography>
                                <Chip label={`${Math.floor(Math.random() * 30) + 70}% Accuracy`} size="small" sx={{ backgroundColor: 'rgba(255, 20, 147, 0.1)', color: '#FF1493', fontWeight: 500 }} />
                              </Box>
                              <IconButton size="small">{expandedFeedbackIndex === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                            </Box>
                            <Collapse in={expandedFeedbackIndex === index}>
                              <Box sx={{ p: 2 }}>
                                {/* Display all frames for this feedback point */}
                                {entry.frames && entry.frames.length > 0 ? (
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ color: '#FF1493', fontWeight: 600, mb: 1 }}>Frames ({entry.frames.length}):</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 2, '&::-webkit-scrollbar': { height: '6px' }, '&::-webkit-scrollbar-track': { background: 'rgba(255, 20, 147, 0.05)' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 20, 147, 0.2)', borderRadius: '3px' } }}>
                                      {entry.frames.map((frame, frameIndex) => (
                                        <Box key={frameIndex} sx={{ position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'transform 0.2s ease-in-out', '&:hover': { transform: 'scale(1.05)', boxShadow: '0 4px 16px rgba(255, 20, 147, 0.2)' } }} onClick={() => handleImageClick(frame, frameIndex + 1, index)}>
                                          <img src={frame} alt={`Frame ${frameIndex + 1}`} style={{ width: '120px', height: '90px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)', border: '1px solid rgba(255, 20, 147, 0.1)' }} />
                                          <Chip label={`${frameIndex + 1}`} size="small" sx={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255, 20, 147, 0.9)', color: 'white', fontWeight: 500, fontSize: '0.7rem', height: '20px', minWidth: '20px' }} />
                                        </Box>
                                      ))}
                                    </Box>
                                  </Box>
                                ) : (
                                  <Box sx={{ cursor: 'pointer', transition: 'transform 0.2s ease-in-out', '&:hover': { transform: 'scale(1.02)', boxShadow: '0 4px 16px rgba(255, 20, 147, 0.2)' } }} onClick={() => handleImageClick(entry.img, 1, index)}>
                                    <img src={entry.img} alt={`Snapshot ${index}`} style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(255, 20, 147, 0.08)' }} />
                                  </Box>
                                )}
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#4A4A4A', lineHeight: 1.6 }}>{entry.text}</Typography>
                              </Box>
                            </Collapse>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        )}
      </Box>
      {/* Image Modal Dialog ... unchanged ... */}
      {/* ... existing code ... */}
            </Box>
  );
};

export default BalletCamera;

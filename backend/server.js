const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');
const aiReportRoutes = require('./routes/aiReports');
const workoutRoutes = require('./routes/workouts');
const auth = require('./middleware/auth');
const { applyTimestamps } = require('./models/ChatSession');

const app = express();
const server = http.createServer(app);

// Create Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const router = express.Router();

const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: 'http://localhost:3000', // Set the allowed origin for requests http://localhost:3000 https://connectarts-frontend-2.onrender.com
  credentials: true
}));

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');// http://localhost:3000 https://connectarts-frontend-2.onrender.com
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

// Middleware
// app.use(cors( {
//   origin: 'http://localhost:3000', // or function for multiple origins
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
//   credentials: true, // if you need to send cookies or HTTP auth
// }));

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
//   res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
//   next();
// });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection with proper options
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hemchande:He10072638@cluster0.r51ez.mongodb.net/danceai?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('CORS is set!');
});

// Public routes (no auth required)
app.use('/auth', authRoutes);

// Protected routes (auth required)
app.use('/chat', auth, chatRoutes);
app.use('/ai-reports', auth, aiReportRoutes);
app.use('/workouts', workoutRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 WebSocket client connected:', socket.id);
  console.log('🌐 Client transport:', socket.conn.transport.name);
  console.log('🔗 Client address:', socket.handshake.address);

  socket.on('register', (data) => {
    console.log('👤 User registered:', data.user_id);
    console.log('🆔 [register] Socket ID:', socket.id);
    socket.userId = data.user_id;
  });

  socket.on('send_frame', async (data) => {
    console.log('📤 Received frame from user:', data.user_id);
    console.log('🆔 [send_frame] Socket ID:', socket.id);
    console.log('📊 Frame data length:', data.image_data ? data.image_data.length : 'No data');
    
    try {
      // Mock mesh processing - replace with actual mesh processing logic
      const mockMeshImage = await processMeshFrame(data.image_data);
      
      if (mockMeshImage) {
        // Send mesh result back to the client
        socket.emit('mesh_result', {
          user_id: data.user_id,
          image_b64: mockMeshImage
        });
        
        console.log('✅ Mesh result sent to client');
        console.log('🆔 [mesh_result] Socket ID:', socket.id);
        console.log('📊 Mesh data length:', mockMeshImage.length);
      } else {
        console.error('❌ No mesh image generated');
        socket.emit('mesh_error', {
          user_id: data.user_id,
          error: 'No mesh image generated'
        });
      }
    } catch (error) {
      console.error('❌ Error processing mesh frame:', error);
      socket.emit('mesh_error', {
        user_id: data.user_id,
        error: 'Failed to process mesh frame: ' + error.message
      });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 WebSocket client disconnected:', socket.id);
    console.log('🆔 [disconnect] Socket ID:', socket.id);
    console.log('📊 Disconnect reason:', reason);
  });
});

// Mock mesh processing function - replace with actual implementation
async function processMeshFrame(imageData) {
  // This is a mock implementation
  // In a real implementation, you would:
  // 1. Decode the base64 image
  // 2. Process it with your mesh detection model
  // 3. Return the processed mesh image as base64
  
  console.log('🎯 Processing mesh frame...');
  
  try {
    // For now, return a mock mesh image (you can replace this with actual processing)
    // This creates a simple colored rectangle as a placeholder
    const canvas = require('canvas');
    const { createCanvas } = canvas;
    
    const width = 320;
    const height = 480;
    const canvasInstance = createCanvas(width, height);
    const ctx = canvasInstance.getContext('2d');
    
    // Create a mock mesh visualization
    ctx.fillStyle = '#FF1493';
    ctx.fillRect(0, 0, width, height);
    
    // Add some mock mesh lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(270, 50);
    ctx.lineTo(270, 430);
    ctx.lineTo(50, 430);
    ctx.closePath();
    ctx.stroke();
    
    // Add text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText('Mesh Overlay', 100, 240);
    
    // Convert to base64
    const result = canvasInstance.toDataURL('image/jpeg').split(',')[1];
    console.log('✅ Mock mesh generated successfully');
    return result;
  } catch (error) {
    console.error('❌ Error in processMeshFrame:', error);
    // Return a simple fallback
    return null;
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request entity too large' });
  }
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server with Socket.IO
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT} with WebSocket support`);
});

// Export the Express API
module.exports = app;
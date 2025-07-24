const { io } = require('socket.io-client');

// Test WebSocket connection
const socket = io('http://localhost:8000', {
  transports: ['websocket'],
  timeout: 20000,
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  
  // Register user
  socket.emit('register', { user_id: 'test-user-123' });
  
  // Create a simple test image
  const canvas = require('canvas');
  const { createCanvas } = canvas;
  
  const testCanvas = createCanvas(100, 100);
  const ctx = testCanvas.getContext('2d');
  
  ctx.fillStyle = '#FF1493';
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Arial';
  ctx.fillText('TEST', 20, 50);
  
  const testImage = testCanvas.toDataURL('image/jpeg').split(',')[1];
  
  console.log('📤 Sending test frame...');
  socket.emit('send_frame', {
    user_id: 'test-user-123',
    image_data: testImage,
  });
});

socket.on('mesh_result', (data) => {
  console.log('🎯 Received mesh result:', data);
  console.log('📊 Mesh image data length:', data.image_b64 ? data.image_b64.length : 'No data');
  
  if (data.image_b64) {
    console.log('✅ Mesh processing successful!');
  } else {
    console.log('❌ No mesh image data received');
  }
  
  // Close connection after test
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 1000);
});

socket.on('mesh_error', (data) => {
  console.error('❌ Mesh processing error:', data.error);
  socket.disconnect();
  process.exit(1);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('⏰ Test timeout');
  socket.disconnect();
  process.exit(1);
}, 10000); 
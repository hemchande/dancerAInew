const io = require('socket.io-client');

console.log('🧪 Testing WebSocket connection to mesh service...');

const socket = io('http://localhost:8001', { 
  transports: ['websocket'],
  timeout: 10000
});

let testResults = {
  connected: false,
  registered: false,
  frameSent: false,
  meshReceived: false,
  errors: []
};

// Test connection
socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('🆔 Socket ID:', socket.id);
  testResults.connected = true;
  
  // Test registration
  console.log('👤 Registering user...');
  socket.emit('register', { user_id: 'test-user' });
});

// Test registration response
socket.on('registered', (data) => {
  console.log('✅ User registered successfully:', data);
  testResults.registered = true;
});

// Test mesh result
socket.on('mesh_result', (data) => {
  console.log('🎯 Mesh result received!');
  console.log('📊 Data type:', typeof data);
  console.log('📊 Data keys:', Object.keys(data || {}));
  
  if (data && data.image_b64) {
    console.log('✅ Valid mesh image data received');
    console.log('📊 Image data length:', data.image_b64.length);
    console.log('🔍 First 50 chars:', data.image_b64.substring(0, 50));
    console.log('🔍 Last 50 chars:', data.image_b64.substring(data.image_b64.length - 50));
    
    // Validate base64
    if (data.image_b64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
      console.log('✅ Base64 validation passed');
      testResults.meshReceived = true;
    } else {
      console.error('❌ Invalid base64 data');
      testResults.errors.push('Invalid base64 data');
    }
  } else {
    console.error('❌ No valid image data in mesh result');
    testResults.errors.push('No image data in mesh result');
  }
  
  // Send test frame after a short delay
  setTimeout(() => {
    if (!testResults.frameSent) {
      sendTestFrame();
    }
  }, 1000);
});

// Test error handling
socket.on('mesh_error', (data) => {
  console.error('❌ Mesh processing error:', data.error);
  testResults.errors.push(`Mesh error: ${data.error}`);
});

// Test connection error
socket.on('connect_error', (error) => {
  console.error('❌ WebSocket connection failed:', error.message);
  testResults.errors.push(`Connection error: ${error.message}`);
});

// Test disconnect
socket.on('disconnect', (reason) => {
  console.log('🔌 WebSocket disconnected:', reason);
});

// Listen for any other events
socket.onAny((eventName, ...args) => {
  console.log('📡 Event received:', eventName, args);
});

function sendTestFrame() {
  if (!testResults.connected) {
    console.error('❌ Cannot send frame - not connected');
    return;
  }
  
  console.log('📤 Sending test frame...');
  
  // Create a simple test image
  const canvas = require('canvas');
  const testCanvas = canvas.createCanvas(100, 100);
  const ctx = testCanvas.getContext('2d');
  
  ctx.fillStyle = '#FF1493';
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Arial';
  ctx.fillText('TEST', 30, 50);
  
  const imageBuffer = testCanvas.toBuffer('image/jpeg');
  const base64 = imageBuffer.toString('base64');
  
  console.log('📊 Test image base64 length:', base64.length);
  console.log('🔍 First 50 chars:', base64.substring(0, 50));
  
  socket.emit('send_frame', {
    user_id: 'test-user',
    image_data: base64
  });
  
  testResults.frameSent = true;
  console.log('📤 Test frame sent');
}

// Send test frame after connection
setTimeout(() => {
  if (testResults.connected && !testResults.frameSent) {
    sendTestFrame();
  }
}, 2000);

// Print results after 10 seconds
setTimeout(() => {
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log('✅ Connected:', testResults.connected);
  console.log('✅ Registered:', testResults.registered);
  console.log('✅ Frame Sent:', testResults.frameSent);
  console.log('✅ Mesh Received:', testResults.meshReceived);
  
  if (testResults.errors.length > 0) {
    console.log('❌ Errors:');
    testResults.errors.forEach(error => console.log('  -', error));
  }
  
  if (testResults.connected && testResults.registered && testResults.frameSent && testResults.meshReceived) {
    console.log('🎉 All tests passed! Mesh service is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
  
  socket.disconnect();
  process.exit(0);
}, 10000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  socket.disconnect();
  process.exit(0);
}); 
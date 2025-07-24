const io = require('socket.io-client');

console.log('⏳ Testing WebSocket with longer timeout for mesh processing...');

const socket = io('http://localhost:8001', { 
  transports: ['websocket'],
  timeout: 30000
});

let eventsReceived = [];
let jobId = null;

// Listen for ALL events
socket.onAny((eventName, ...args) => {
  console.log(`📡 Event: ${eventName}`, args);
  eventsReceived.push({ event: eventName, args, timestamp: new Date().toISOString() });
  
  if (eventName === 'job_submitted' && args[0] && args[0].job_id) {
    jobId = args[0].job_id;
    console.log(`📋 Job submitted with ID: ${jobId}`);
  }
});

// Test connection
socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('🆔 Socket ID:', socket.id);
  
  // Test registration
  console.log('👤 Registering user...');
  socket.emit('register', { user_id: 'test-user' });
});

// Test connection error
socket.on('connect_error', (error) => {
  console.error('❌ WebSocket connection failed:', error.message);
});

// Test disconnect
socket.on('disconnect', (reason) => {
  console.log('🔌 WebSocket disconnected:', reason);
});

function sendTestFrame() {
  console.log('📤 Sending test frame...');
  
  // Create a simple base64 test image (1x1 pixel)
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  socket.emit('send_frame', {
    user_id: 'test-user',
    image_data: base64
  });
  
  console.log('📤 Test frame sent');
}

// Send test frame after connection
setTimeout(() => {
  sendTestFrame();
}, 2000);

// Print all events after 30 seconds
setTimeout(() => {
  console.log('\n📊 All Events Received (30s timeout):');
  console.log('=====================================');
  
  if (eventsReceived.length === 0) {
    console.log('❌ No events received');
  } else {
    eventsReceived.forEach((event, index) => {
      console.log(`${index + 1}. ${event.event} at ${event.timestamp}`);
      console.log(`   Args:`, event.args);
      console.log('');
    });
  }
  
  if (jobId) {
    console.log(`📋 Job ID received: ${jobId}`);
    console.log('💡 The mesh service might be processing the job asynchronously');
    console.log('💡 Check if there are any other endpoints or events for job results');
  }
  
  socket.disconnect();
  process.exit(0);
}, 30000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  socket.disconnect();
  process.exit(0);
}); 
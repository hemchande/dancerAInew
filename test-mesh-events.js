const io = require('socket.io-client');

console.log('🔍 Testing all WebSocket events from mesh service...');

const socket = io('http://localhost:8001', { 
  transports: ['websocket'],
  timeout: 10000
});

let eventsReceived = [];

// Listen for ALL events
socket.onAny((eventName, ...args) => {
  console.log(`📡 Event: ${eventName}`, args);
  eventsReceived.push({ event: eventName, args, timestamp: new Date().toISOString() });
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

// Print all events after 10 seconds
setTimeout(() => {
  console.log('\n📊 All Events Received:');
  console.log('======================');
  
  if (eventsReceived.length === 0) {
    console.log('❌ No events received');
  } else {
    eventsReceived.forEach((event, index) => {
      console.log(`${index + 1}. ${event.event} at ${event.timestamp}`);
      console.log(`   Args:`, event.args);
      console.log('');
    });
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
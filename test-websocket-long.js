const { io } = require('socket.io-client');

console.log('🧪 Testing WebSocket with longer wait time...');

const socket = io('http://localhost:8001', { 
  transports: ['websocket'],
  timeout: 10000
});

let testResults = {
  connected: false,
  eventsReceived: [],
  errors: []
};

// Listen to ALL events
socket.onAny((eventName, ...args) => {
  console.log(`📡 Event received: "${eventName}"`);
  console.log('📊 Event data:', args);
  console.log('📊 Event data type:', typeof args[0]);
  if (args[0] && typeof args[0] === 'object') {
    console.log('📊 Event data keys:', Object.keys(args[0]));
  }
  testResults.eventsReceived.push({ eventName, data: args, timestamp: new Date().toISOString() });
});

// Test connection
socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('🆔 Socket ID:', socket.id);
  testResults.connected = true;
  
  // Test registration
  console.log('👤 Registering user...');
  socket.emit('register', { user_id: 'test-user-long' });
});

// Test connection error
socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  testResults.errors.push(`Connection failed: ${error.message}`);
  process.exit(1);
});

function sendTestFrame() {
  if (!testResults.connected) {
    console.error('❌ Cannot send frame - not connected');
    return;
  }
  
  console.log('📤 Sending test frame...');
  
  // Create a simple base64 test image (1x1 pixel)
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  console.log('📊 Test image base64 length:', base64.length);
  
  socket.emit('send_frame', {
    user_id: 'test-user-long',
    image_data: base64
  });
  
  console.log('📤 Test frame sent');
}

function printTestSummary() {
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`✅ Connected: ${testResults.connected}`);
  console.log(`🆔 Socket ID: ${socket.id}`);
  console.log(`📡 Events Received: ${testResults.eventsReceived.length}`);
  
  if (testResults.eventsReceived.length > 0) {
    console.log('\n📡 All Events:');
    testResults.eventsReceived.forEach((event, index) => {
      console.log(`   ${index + 1}. "${event.eventName}" at ${event.timestamp} - ${JSON.stringify(event.data)}`);
    });
  }
  
  if (testResults.errors.length > 0) {
    console.log(`\n❌ Errors: ${testResults.errors.length}`);
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  console.log('\n🎯 Test completed');
}

// Send test frame after connection
setTimeout(() => {
  if (testResults.connected) {
    sendTestFrame();
  } else {
    console.error('❌ Connection timeout');
    process.exit(1);
  }
}, 2000);

// Print summary and exit after 30 seconds (longer wait)
setTimeout(() => {
  printTestSummary();
  socket.disconnect();
  process.exit(0);
}, 30000); 
const { io } = require('socket.io-client');

console.log('🧪 Testing WebSocket connection with correct port...');

const socket = io('http://localhost:8001', { 
  transports: ['websocket'],
  timeout: 10000
});

let testResults = {
  connected: false,
  socketId: null,
  eventsReceived: []
};

// Listen to ALL events
socket.onAny((eventName, ...args) => {
  console.log(`📡 Event received: "${eventName}"`);
  console.log('🆔 Current Socket ID:', socket.id);
  console.log('📊 Event data:', args);
  console.log('📊 Event data type:', typeof args[0]);
  if (args[0] && typeof args[0] === 'object') {
    console.log('📊 Event data keys:', Object.keys(args[0]));
    if (args[0].image_b64) {
      console.log('✅ Found image_b64 data!');
      console.log('📊 Image data length:', args[0].image_b64.length);
    }
  }
  testResults.eventsReceived.push({ 
    eventName, 
    data: args, 
    timestamp: new Date().toISOString(),
    socketId: socket.id
  });
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('🆔 Socket ID:', socket.id);
  testResults.connected = true;
  testResults.socketId = socket.id;
  
  // Register user
  console.log('👤 Registering user...');
  socket.emit('register', { user_id: 'test-correct-port' });
  
  // Send test frame after registration
  setTimeout(() => {
    console.log('📤 Sending test frame...');
    console.log('🆔 Sending from Socket ID:', socket.id);
    
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const frameData = {
      user_id: 'test-correct-port',
      image_data: base64,
      socket_id: socket.id
    };
    
    socket.emit('send_frame', frameData);
    console.log('📤 Test frame sent');
  }, 1000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
});

function printSummary() {
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`✅ Connected: ${testResults.connected}`);
  console.log(`🆔 Socket ID: ${testResults.socketId}`);
  console.log(`📡 Events Received: ${testResults.eventsReceived.length}`);
  
  if (testResults.eventsReceived.length > 0) {
    console.log('\n📡 All Events:');
    testResults.eventsReceived.forEach((event, index) => {
      console.log(`   ${index + 1}. "${event.eventName}" at ${event.timestamp}`);
      if (event.data[0] && event.data[0].image_b64) {
        console.log(`      ✅ Contains image_b64 data (${event.data[0].image_b64.length} chars)`);
      }
    });
  }
  
  console.log('\n🎯 Test completed');
  socket.disconnect();
  process.exit(0);
}

// Run for 15 seconds
setTimeout(() => {
  printSummary();
}, 15000); 
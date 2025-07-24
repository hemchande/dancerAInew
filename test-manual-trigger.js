const { io } = require('socket.io-client');

console.log('🧪 Testing manual mesh processing trigger...');

const socket = io('http://localhost:8001', { 
  transports: ['websocket'],
  timeout: 10000
});

let testResults = {
  connected: false,
  socketId: null,
  eventsReceived: []
};

// Listen to ALL possible events
const possibleEvents = [
  'mesh_result', 'mesh', 'result', 'image', 'processed', 'complete', 
  'finished', 'ready', 'processed_frame', 'frame_result', 'mesh_ready',
  'job_complete', 'processing_done', 'mesh_processed'
];

possibleEvents.forEach(eventName => {
  socket.on(eventName, (data) => {
    console.log(`🎯 Event "${eventName}" received:`, data);
    console.log('🆔 Socket ID:', socket.id);
    console.log('📊 Event data type:', typeof data);
    if (data && typeof data === 'object') {
      console.log('📊 Event data keys:', Object.keys(data));
      if (data.image_b64) {
        console.log('✅ Found image_b64 data!');
        console.log('📊 Image data length:', data.image_b64.length);
      }
    }
    testResults.eventsReceived.push({ eventName, data, timestamp: new Date().toISOString() });
  });
});

// Listen to ALL events (catch any we missed)
socket.onAny((eventName, ...args) => {
  console.log(`📡 Generic event received: "${eventName}"`);
  console.log('🆔 Socket ID:', socket.id);
  console.log('📊 Event data:', args);
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('🆔 Socket ID:', socket.id);
  testResults.connected = true;
  testResults.socketId = socket.id;
  
  // Register user
  socket.emit('register', { user_id: 'test-manual-trigger' });
  
  // Try to manually trigger processing
  setTimeout(() => {
    console.log('🔧 Attempting manual processing trigger...');
    
    // Try different trigger events
    socket.emit('process_frame', { 
      user_id: 'test-manual-trigger',
      socket_id: socket.id,
      trigger: 'manual'
    });
    
    socket.emit('get_mesh', { 
      user_id: 'test-manual-trigger',
      socket_id: socket.id
    });
    
    socket.emit('request_mesh', { 
      user_id: 'test-manual-trigger',
      socket_id: socket.id
    });
    
  }, 2000);
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
      if (event.data && event.data.image_b64) {
        console.log(`      ✅ Contains image_b64 data (${event.data.image_b64.length} chars)`);
      }
    });
  }
  
  console.log('\n🎯 Test completed');
  socket.disconnect();
  process.exit(0);
}

// Run for 30 seconds to catch any delayed responses
setTimeout(() => {
  printSummary();
}, 30000); 
const { io } = require('socket.io-client');

console.log('🧪 Testing WebSocket connection to mesh service on port 8001...');

const socket = io('http://localhost:8001', { 
  transports: ['websocket'],
  timeout: 10000
});

let testResults = {
  connected: false,
  registered: false,
  frameSent: false,
  meshReceived: false,
  connectionId: null,
  errors: []
};

// Test connection
socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('🆔 Socket ID:', socket.id);
  testResults.connected = true;
  testResults.connectionId = socket.id;
  
  // Test registration
  console.log('👤 Registering user...');
  socket.emit('register', { user_id: 'test-user-simple' });
});

// Test mesh result
socket.on('mesh_result', (data) => {
  console.log('🎯 Mesh result received!');
  console.log('🆔 [mesh_result] Socket ID:', socket.id);
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
  
  // Print test summary and exit
  setTimeout(() => {
    printTestSummary();
    socket.disconnect();
    process.exit(0);
  }, 1000);
});

// Test error handling
socket.on('mesh_error', (data) => {
  console.error('❌ Mesh error received:', data);
  testResults.errors.push(data.error || 'Unknown mesh error');
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
  console.log('🔍 Base64 data:', base64);
  
  socket.emit('send_frame', {
    user_id: 'test-user-simple',
    image_data: base64
  });
  
  testResults.frameSent = true;
  console.log('📤 Test frame sent');
}

function printTestSummary() {
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`✅ Connected: ${testResults.connected}`);
  console.log(`🆔 Connection ID: ${testResults.connectionId || 'None'}`);
  console.log(`👤 Registered: ${testResults.registered}`);
  console.log(`📤 Frame Sent: ${testResults.frameSent}`);
  console.log(`🎯 Mesh Received: ${testResults.meshReceived}`);
  
  if (testResults.errors.length > 0) {
    console.log(`❌ Errors: ${testResults.errors.length}`);
    testResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  } else {
    console.log('✅ No errors encountered');
  }
  
  const allPassed = testResults.connected && testResults.frameSent && testResults.meshReceived;
  console.log(`\n🎯 Overall Result: ${allPassed ? 'PASSED' : 'FAILED'}`);
}

// Send test frame after connection
setTimeout(() => {
  if (testResults.connected && !testResults.frameSent) {
    sendTestFrame();
  } else if (!testResults.connected) {
    console.error('❌ Connection timeout');
    process.exit(1);
  }
}, 2000);

// Timeout after 10 seconds
setTimeout(() => {
  if (!testResults.meshReceived) {
    console.error('❌ Test timeout - no mesh result received');
    printTestSummary();
    socket.disconnect();
    process.exit(1);
  }
}, 10000); 
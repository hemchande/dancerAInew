const { io } = require('socket.io-client');

console.log('🧪 Testing multiple WebSocket connections and queue behavior...');

// Create multiple connections to simulate queue issues
const connections = [];
const numConnections = 3;

for (let i = 0; i < numConnections; i++) {
  const socket = io('http://localhost:8001', { 
    transports: ['websocket'],
    timeout: 10000
  });
  
  const connection = {
    id: i,
    socket: socket,
    connected: false,
    socketId: null,
    eventsReceived: []
  };
  
  socket.on('connect', () => {
    console.log(`✅ Connection ${i} connected! Socket ID: ${socket.id}`);
    connection.connected = true;
    connection.socketId = socket.id;
    
    // Register user
    socket.emit('register', { user_id: `test-user-${i}` });
  });
  
  socket.onAny((eventName, ...args) => {
    console.log(`📡 Connection ${i} received: "${eventName}"`);
    console.log(`🆔 Connection ${i} Socket ID: ${socket.id}`);
    console.log('📊 Event data:', args);
    
    connection.eventsReceived.push({ eventName, data: args, timestamp: new Date().toISOString() });
  });
  
  connections.push(connection);
}

function sendFrameFromConnection(connectionIndex) {
  const connection = connections[connectionIndex];
  if (!connection.connected) {
    console.error(`❌ Connection ${connectionIndex} not connected`);
    return;
  }
  
  console.log(`📤 Sending frame from connection ${connectionIndex}...`);
  console.log(`🆔 Socket ID: ${connection.socketId}`);
  
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  const frameData = {
    user_id: `test-user-${connectionIndex}`,
    image_data: base64,
    socket_id: connection.socketId,
    connection_index: connectionIndex
  };
  
  connection.socket.emit('send_frame', frameData);
  console.log(`📤 Frame sent from connection ${connectionIndex}`);
}

function printSummary() {
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  connections.forEach((conn, index) => {
    console.log(`\n🔌 Connection ${index}:`);
    console.log(`   Connected: ${conn.connected}`);
    console.log(`   Socket ID: ${conn.socketId}`);
    console.log(`   Events: ${conn.eventsReceived.length}`);
    
    conn.eventsReceived.forEach((event, eventIndex) => {
      console.log(`     ${eventIndex + 1}. "${event.eventName}" at ${event.timestamp}`);
    });
  });
  
  // Disconnect all connections
  connections.forEach(conn => {
    if (conn.socket) {
      conn.socket.disconnect();
    }
  });
  
  console.log('\n🎯 Test completed');
  process.exit(0);
}

// Wait for all connections to establish, then send frames
setTimeout(() => {
  console.log('\n📤 Sending frames from all connections...');
  
  // Send frames with delays to create queue
  connections.forEach((conn, index) => {
    setTimeout(() => {
      sendFrameFromConnection(index);
    }, index * 1000); // 1 second delay between each
  });
  
  // Wait longer for responses
  setTimeout(() => {
    printSummary();
  }, 20000);
  
}, 3000); 
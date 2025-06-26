import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useWebSocket = (userId, onMeshResult) => {
  const socketRef = useRef();

  useEffect(() => {
    console.log('🔌 Attempting to connect to WebSocket server on port 8002...');
    
    socketRef.current = io("http://localhost:8002",{
      transports: ['websocket'],  // Optional, forces WebSocket over polling
      withCredentials: false       // Set to true if you use cookies
    });
    
    socketRef.current.on("connect", () => {
      console.log('✅ WebSocket connected successfully!');
    });

    socketRef.current.on("connect_error", (error) => {
      console.error('❌ WebSocket connection failed:', error.message);
      console.log('💡 Make sure you have a WebSocket server running on port 8002');
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });
    
    socketRef.current.emit("register", { user_id: userId });
    console.log('👤 Registered user with WebSocket server:', userId);

    socketRef.current.on("mesh_result", (data) => {
      console.log('🎯 Mesh result received from WebSocket:', data);
      onMeshResult(data.image_b64); // image_data is base64
    });

    return () => {
      console.log('🔌 Cleaning up WebSocket connection...');
      socketRef.current.disconnect();
    };
  }, [userId]);

  const sendFrame = (imageDataUrl) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error('❌ Cannot send frame - WebSocket not connected');
      return;
    }
    
    const base64 = imageDataUrl.split(',')[1]; // ✅ remove "data:image/jpeg;base64,"
    console.log('📤 Sending frame to WebSocket server...');
    socketRef.current.emit("send_frame", {
      user_id: userId,
      image_data: base64,
    });
  };

  return sendFrame;
};

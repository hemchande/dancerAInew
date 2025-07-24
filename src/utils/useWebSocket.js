import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import config from '../config/config';

export const useWebSocket = (userId, onMeshResult, onConnectionChange) => {
  const socketRef = useRef();
  const [connectionState, setConnectionState] = useState({
    connected: false,
    connecting: false,
    lastConnected: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 10
  });
  const pendingFramesRef = useRef([]);
  const reconnectTimeoutRef = useRef(null);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const attemptReconnect = useCallback(() => {
    if (connectionState.reconnectAttempts >= connectionState.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    clearReconnectTimeout();
    
    const delay = Math.min(1000 * Math.pow(2, connectionState.reconnectAttempts), 30000); // Exponential backoff, max 30s
    
    console.log(`🔄 Attempting reconnection in ${delay}ms (attempt ${connectionState.reconnectAttempts + 1}/${connectionState.maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.connect();
      }
    }, delay);
  }, [connectionState.reconnectAttempts, connectionState.maxReconnectAttempts, clearReconnectTimeout]);

  const processPendingFrames = useCallback(() => {
    if (!socketRef.current?.connected || pendingFramesRef.current.length === 0) return;
    
    console.log(`📤 Processing ${pendingFramesRef.current.length} pending frames`);
    
    while (pendingFramesRef.current.length > 0) {
      const frame = pendingFramesRef.current.shift();
      if (frame) {
        socketRef.current.emit("send_frame", frame);
      }
    }
  }, []);

  useEffect(() => {
    console.log('🔌 Attempting to connect to WebSocket server at:');
    const wsUrl = 'http://localhost:8001'; // WebSocket server on port 8000
    console.log('🌐 WebSocket URL:', wsUrl);
    console.log('👤 User ID for connection:', userId);
    
    setConnectionState(prev => ({ ...prev, connecting: true }));
    
    socketRef.current = io(wsUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 0, // We'll handle reconnection manually
      timeout: 20000,
      forceNew: true
    });
    
    socketRef.current.on("connect", () => {
      console.log('✅ WebSocket connected successfully!');
      console.log('🔗 Connection URL:', wsUrl);
      console.log('🆔 [connect] Socket ID:', socketRef.current.id);
      console.log('👤 User ID:', userId);
      console.log('🔌 Connection state:', socketRef.current.connected);
      console.log('🌐 Transport:', socketRef.current.io.engine.transport.name);
      
      setConnectionState(prev => ({
        ...prev,
        connected: true,
        connecting: false,
        lastConnected: new Date().toISOString(),
        reconnectAttempts: 0
      }));
      
      if (onConnectionChange) onConnectionChange(true, socketRef.current.id);
      
      // Register user and process any pending frames
      socketRef.current.emit("register", { user_id: userId });
      console.log('👤 Registered user with WebSocket server:', userId, 'SID:', socketRef.current.id);
      
      // Process any frames that were sent while disconnected
      processPendingFrames();
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      console.log('🆔 [disconnect] Socket ID:', socketRef.current.id);
      
      setConnectionState(prev => ({
        ...prev,
        connected: false,
        connecting: false
      }));
      
      if (onConnectionChange) onConnectionChange(false);
      
      // Attempt reconnection for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        console.log('🔄 Server/client disconnect detected, attempting reconnection...');
        attemptReconnect();
      }
    });

    socketRef.current.on("reconnect", (attempt) => {
      console.log('🔄 WebSocket reconnected! Attempt:', attempt);
      console.log('🆔 [reconnect] Socket ID:', socketRef.current.id);
      
      setConnectionState(prev => ({
        ...prev,
        connected: true,
        connecting: false,
        reconnectAttempts: 0
      }));
      
      socketRef.current.emit("register", { user_id: userId });
      console.log('👤 Re-registered user after reconnect:', userId, 'SID:', socketRef.current.id);
      
      if (onConnectionChange) onConnectionChange(true, socketRef.current.id);
      
      // Process pending frames after reconnection
      processPendingFrames();
    });

    socketRef.current.on("connect_error", (error) => {
      console.error('❌ WebSocket connection failed:', error.message);
      console.log('💡 Make sure you have the mesh service running on port 8001');
      
      setConnectionState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        reconnectAttempts: prev.reconnectAttempts + 1
      }));
      
      if (onConnectionChange) onConnectionChange(false, socketRef.current.id);
      
      // Attempt reconnection
      attemptReconnect();
    });

    socketRef.current.on("mesh_result", (data) => {
      console.log('🎯 Mesh result received from WebSocket:', data);
      console.log('🆔 [mesh_result] Socket ID:', socketRef.current.id);
      console.log('📊 Mesh data type:', typeof data);
      console.log('📊 Mesh data keys:', Object.keys(data || {}));
      console.log('📊 Expected Socket ID:', socketRef.current.id);
      console.log('📊 Data Socket ID (if present):', data?.socket_id || 'Not provided');
      
      if (data && data.image_b64) {
        console.log('✅ Valid mesh image data received');
        console.log('📊 Mesh image data length:', data.image_b64.length);
        console.log('🔍 First 50 chars of mesh data:', data.image_b64.substring(0, 50));
        console.log('🔍 Last 50 chars of mesh data:', data.image_b64.substring(data.image_b64.length - 50));
        
        // Validate base64 data
        if (data.image_b64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
          console.log('✅ Base64 validation passed');
          onMeshResult(data.image_b64);
        } else {
          console.error('❌ Invalid base64 data received');
        }
      } else {
        console.error('❌ No valid image data in mesh result');
        console.log('📊 Received data structure:', JSON.stringify(data, null, 2));
      }
    });

    // Add listeners for other possible event names
    socketRef.current.on("mesh", (data) => {
      console.log('🎯 Mesh event received (alternative name):', data);
      console.log('🆔 [mesh] Socket ID:', socketRef.current.id);
      if (data && data.image_b64) {
        console.log('✅ Found image_b64 in mesh event');
        onMeshResult(data.image_b64);
      }
    });

    socketRef.current.on("result", (data) => {
      console.log('🎯 Result event received:', data);
      console.log('🆔 [result] Socket ID:', socketRef.current.id);
      if (data && data.image_b64) {
        console.log('✅ Found image_b64 in result event');
        onMeshResult(data.image_b64);
      }
    });

    socketRef.current.on("image", (data) => {
      console.log('🎯 Image event received:', data);
      console.log('🆔 [image] Socket ID:', socketRef.current.id);
      if (data && data.image_b64) {
        console.log('✅ Found image_b64 in image event');
        onMeshResult(data.image_b64);
      }
    });

    // Add more possible event names
    socketRef.current.on("processed", (data) => {
      console.log('🎯 Processed event received:', data);
      console.log('🆔 [processed] Socket ID:', socketRef.current.id);
      if (data && data.image_b64) {
        console.log('✅ Found image_b64 in processed event');
        onMeshResult(data.image_b64);
      }
    });

    socketRef.current.on("complete", (data) => {
      console.log('🎯 Complete event received:', data);
      console.log('🆔 [complete] Socket ID:', socketRef.current.id);
      if (data && data.image_b64) {
        console.log('✅ Found image_b64 in complete event');
        onMeshResult(data.image_b64);
      }
    });

    socketRef.current.on("finished", (data) => {
      console.log('🎯 Finished event received:', data);
      console.log('🆔 [finished] Socket ID:', socketRef.current.id);
      if (data && data.image_b64) {
        console.log('✅ Found image_b64 in finished event');
        onMeshResult(data.image_b64);
      }
    });

    socketRef.current.on("ready", (data) => {
      console.log('🎯 Ready event received:', data);
      console.log('🆔 [ready] Socket ID:', socketRef.current.id);
      if (data && data.image_b64) {
        console.log('✅ Found image_b64 in ready event');
        onMeshResult(data.image_b64);
      }
    });

    // Add more possible event names that might contain mesh data
    socketRef.current.on("processed_frame", (data) => {
      console.log('🎯 Processed frame event received:', data);
      console.log('🆔 [processed_frame] Socket ID:', socketRef.current.id);
      if (data && data.image_b64) {
        console.log('✅ Found image_b64 in processed_frame event');
        onMeshResult(data.image_b64);
      }
    });

    socketRef.current.on("frame_result", (data) => {
      console.log('🎯 Frame result event received:', data);
      console.log('🆔 [frame_result] Socket ID:', socketRef.current.id);
      if (data && data.image_b64) {
        console.log('✅ Found image_b64 in frame_result event');
        onMeshResult(data.image_b64);
      }
    });

    socketRef.current.on("mesh_ready", (data) => {
      console.log('🎯 Mesh ready event received:', data);
      console.log('🆔 [mesh_ready] Socket ID:', socketRef.current.id);
      if (data && data.image_b64) {
        console.log('✅ Found image_b64 in mesh_ready event');
        onMeshResult(data.image_b64);
      }
    });

    socketRef.current.on("job_submitted", (data) => {
      console.log('📋 Job submitted to mesh service:', data);
      console.log('🆔 Job ID:', data.job_id);
      console.log('⏳ Waiting for mesh processing result...');
    });

    socketRef.current.on("mesh_error", (data) => {
      console.error('❌ Mesh processing error:', data.error);
    });

    // Add event listener for any other messages
    socketRef.current.onAny((eventName, ...args) => {
      console.log('📡 WebSocket event received:', eventName, args);
      console.log('🆔 [onAny] Socket ID:', socketRef.current.id);
      console.log('📊 Event data type:', typeof args[0]);
      console.log('📊 Event data keys:', Object.keys(args[0] || {}));
      
      // Special handling for mesh_result event
      if (eventName === 'mesh_result' && args[0] && args[0].image_b64) {
        console.log('🎯 Mesh result found in onAny event!');
        console.log('📊 Mesh data length:', args[0].image_b64.length);
        onMeshResult(args[0].image_b64);
      }
    });

    return () => {
      console.log('🔌 Cleaning up WebSocket connection...');
      clearReconnectTimeout();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId, attemptReconnect, processPendingFrames]);

      const sendFrame = useCallback((imageDataUrl, meshCorrections = []) => {
      if (!imageDataUrl || !imageDataUrl.includes(',')) {
        console.error('❌ Invalid image data URL');
        console.log('📊 Image data URL type:', typeof imageDataUrl);
        console.log('📊 Image data URL length:', imageDataUrl?.length);
        return;
      }
      
      const base64 = imageDataUrl.split(',')[1]; // ✅ remove "data:image/jpeg;base64,"
      console.log('📤 Preparing frame for WebSocket server...');
      console.log('📊 Base64 data length:', base64.length);
      console.log('🔍 First 50 chars of base64:', base64.substring(0, 50));
      console.log('🆔 [sendFrame] Current Socket ID:', socketRef.current?.id);
      console.log('👤 [sendFrame] User ID:', userId);
      
      // Validate base64 before sending
      if (!base64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        console.error('❌ Invalid base64 data to send');
        return;
      }
      
      const frameData = {
        user_id: userId,
        image_data: base64,
        mesh_corrections: meshCorrections,
        socket_id: socketRef.current?.id // Add socket ID to the frame data
      };
    
    if (!socketRef.current || !socketRef.current.connected) {
      console.log('⏳ WebSocket not connected, queuing frame for later...');
      console.log('🔌 Socket connected status:', socketRef.current?.connected);
      console.log('📊 Connection state:', connectionState);
      
      // Queue the frame for later processing
      pendingFramesRef.current.push(frameData);
      
      // Limit queue size to prevent memory issues
      if (pendingFramesRef.current.length > 50) {
        console.log('⚠️ Pending frames queue full, removing oldest frame');
        pendingFramesRef.current.shift();
      }
      
      return;
    }
    
    // Send immediately if connected
    socketRef.current.emit("send_frame", frameData);
    console.log('📤 Frame sent successfully (SID:', socketRef.current.id, ")");
    console.log('📊 Frame data user_id:', frameData.user_id);
    console.log('📊 Frame data image length:', frameData.image_data.length);
  }, [userId, connectionState]);

  return sendFrame;
};

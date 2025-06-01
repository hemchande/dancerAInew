class WebSocketAdapter {
    constructor(url) {
      this.url = url;
      this.socket = null;
      this.reconnectInterval = 5000; // Reconnect every 5 seconds if disconnected
      this.messageListeners = [];
      this.connect();
    }
  
    connect() {
      this.socket = new WebSocket(this.url);
  
      this.socket.onopen = () => {
        console.log("✅ WebSocket Connected:", this.url);
      };
  
      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("📩 Message Received:", message);
        this.messageListeners.forEach((callback) => callback(message));
      };
  
      this.socket.onclose = () => {
        console.warn("⚠️ WebSocket Disconnected! Reconnecting...");
        setTimeout(() => this.connect(), this.reconnectInterval);
      };
  
      this.socket.onerror = (error) => {
        console.error("❌ WebSocket Error:", error);
      };
    }
  
    sendMessage(message) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message));
      } else {
        console.warn("⚠️ Cannot send message, WebSocket is not open.");
      }
    }
  
    addMessageListener(callback) {
      this.messageListeners.push(callback);
    }
  
    removeMessageListener(callback) {
      this.messageListeners = this.messageListeners.filter((cb) => cb !== callback);
    }
  
    closeConnection() {
      if (this.socket) {
        this.socket.close();
      }
    }
  }
  
  export default WebSocketAdapter;
  
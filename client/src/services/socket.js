import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(userId = null) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (typeof window === 'undefined') return null;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[Socket] Connected to Agentflow real-time event bus:', this.socket.id);
      if (userId) {
        this.joinUserRoom(userId);
      }
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('[Socket] Disconnected from Agentflow real-time event bus');
    });

    return this.socket;
  }

  joinExecutionRoom(executionId) {
    if (this.socket && executionId) {
      this.socket.emit('join:execution', executionId);
    }
  }

  leaveExecutionRoom(executionId) {
    if (this.socket && executionId) {
      this.socket.emit('leave:execution', executionId);
    }
  }

  joinUserRoom(userId) {
    if (this.socket && userId) {
      this.socket.emit('join:user', userId);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

const socketService = new SocketService();
export function getSocket() {
  return socketService.connect();
}
export default socketService;

const { Server } = require('socket.io');
const env = require('./env');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for a specific execution timeline
    socket.on('join:execution', (executionId) => {
      if (executionId) {
        socket.join(`execution:${executionId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined room execution:${executionId}`);
      }
    });

    socket.on('leave:execution', (executionId) => {
      if (executionId) {
        socket.leave(`execution:${executionId}`);
      }
    });

    // Join room for user-specific notifications and alerts
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined room user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

const emitExecutionEvent = (executionId, eventType, data) => {
  if (!io) return;
  // Emit to specific execution room
  io.to(`execution:${executionId}`).emit(eventType, data);
  // Also emit globally for dashboard / live activity monitors
  io.emit('execution:event', { executionId, eventType, data });
};

const emitNotification = (userId, notification) => {
  if (!io) return;
  if (userId) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }
  // Also broadcast to all authenticated connections
  io.emit('notification:broadcast', notification);
};

module.exports = {
  initSocket,
  getIO,
  emitExecutionEvent,
  emitNotification,
};

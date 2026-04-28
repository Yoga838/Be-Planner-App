// src/config/socket.js
const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Configure appropriately for production
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`Desktop client connected: ${socket.id}`);

    // Join user-specific room for targeted notifications
    socket.on('join-room', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Handle real-time quest updates
    socket.on('quest-update', (data) => {
      socket.broadcast.emit('quest-changed', data);
    });

    socket.on('disconnect', () => {
      console.log(`Desktop client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// PENTING: Export dengan cara yang benar
module.exports = { 
  initializeSocket,  // ini function
  getIO              // ini juga function
};
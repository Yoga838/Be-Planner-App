// src/config/socket.js - Serverless version
let io = null;

function initializeSocket(server) {
  // Di Vercel, Socket.io tidak bisa jalan karena serverless
  // Gunakan Supabase Realtime sebagai alternative untuk production
  if (process.env.VERCEL) {
    console.log('⚠️  Running on Vercel - WebSocket disabled');
    console.log('💡 Use Supabase Realtime or Pusher for real-time features');
    return null;
  }

  // Kalo di local/development, jalanin Socket.io seperti biasa
  try {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log(`🟢 Client connected: ${socket.id}`);
      socket.on('join-room', (userId) => {
        if (userId) {
          socket.join(`user-${userId}`);
        }
      });
      socket.on('disconnect', () => {
        console.log(`🔴 Client disconnected: ${socket.id}`);
      });
    });

    console.log('✅ Socket.io initialized');
    return io;
  } catch (error) {
    console.warn('⚠️  Socket.io initialization failed:', error.message);
    return null;
  }
}

function getIO() {
  if (process.env.VERCEL) {
    console.warn('WebSocket not available on Vercel');
    return null;
  }
  return io;
}

module.exports = { initializeSocket, getIO };
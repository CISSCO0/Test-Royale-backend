/**
 * Socket.io configuration and connection handling
 */

const { Server } = require('socket.io');
const socketHandler = require('./socketHandler');
const RoomService = require('../services/roomService');
const GameService = require('../services/gameService');
const cookie = require('cookie');
const AuthService = require('../services/authService');
const authService = new AuthService();
const { config } = require('../config/env');



/**
 * Initialize Socket.io
 * @param {Object} server - HTTP server instance
 * @returns {Object} Configured Socket.io instance
 */
function initializeSocketIO(server) {
  const io = new Server(server, {
    cors: config.socket.cors,
    transports: ['websocket', 'polling']
  });
  
  // Socket.IO middleware to authenticate via cookie or auth token
  io.use((socket, next) => {
    try {
      let token = null;
      
      // Try to get token from auth (sent by socket.io client)
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }
      
      // Fallback to cookies if no auth token
      if (!token) {
        const cookies = socket.handshake.headers.cookie;
        if (cookies) {
          const parsed = cookie.parse(cookies);
          token = parsed['auth_token'];
        }
      }
      
      if (!token) {
        return next(new Error('Authentication error: no token provided'));
      }

      const verified = authService.verifyToken(token);
      if (!verified.success) {
        return next(new Error('Invalid token'));
      }

      socket.playerId = verified.playerId; // attach playerId to socket
      next();
    } catch (err) {
      console.error('Socket auth error:', err);
      next(new Error('Authentication error'));
    }
  });


  // Initialize services
  const roomService = new RoomService();
  const gameService = new GameService();
  // Handle connection
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Initialize room handler for this socket
    socketHandler(io, socket, roomService, gameService);
    
    // Send connection confirmation
    socket.emit('connected', {
      success: true,
      socketId: socket.id,
      message: 'Connected to game server'
    });
  });

  // Handle disconnection
  io.on('disconnect', (socket) => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Periodic cleanup of empty rooms
  setInterval(() => {
    const cleaned = roomService.cleanupEmptyRooms();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} empty rooms`);
    }
  }, 300000); // Every 5 minutes

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    io.close(() => {
      console.log('Socket.io server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    io.close(() => {
      console.log('Socket.io server closed');
      process.exit(0);
    });
  });

  return io;
}

module.exports = initializeSocketIO;
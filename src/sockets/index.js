/**
 * Socket.io configuration and connection handling
 */

const { Server } = require('socket.io');
const roomHandler = require('./roomHandler');
const RoomService = require('../services/roomService');
const GameController = require('../controllers/gameController');

/**
 * Initialize Socket.io
 * @param {Object} server - HTTP server instance
 * @returns {Object} Configured Socket.io instance
 */
function initializeSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Initialize services
  const roomService = new RoomService();
  const gameController = new GameController(roomService);

  // Handle connection
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Initialize room handler for this socket
    roomHandler(io, socket, roomService, gameController);
    
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
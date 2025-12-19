
const http = require('http');
const express = require('express');
const cors = require('cors');
const { config, validateConfig } = require('./src/config/env');
const createApp = require('./src/app');
const connectDB = require('./src/config/db');
console.log("BOOT OK");

// Validate configuration
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error.message);
  process.exit(1);
}


// Create HTTP server
const server = http.createServer();

// Create Express app and Socket.io instance
const { app, io } = createApp(server);
app.use(express.json());

// Backend CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend.vercel.app'
  ],
  credentials: true
}));



// Mount Express app on the server
server.on('request', app);

// Connect to MongoDB
connectDB();

// Start server
const PORT = config.port;
const HOST = config.host;

server.listen(PORT, HOST, () => {
  console.log(`🚀 Game server running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🎮 Socket.io enabled for real-time communication`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (config.development.isDev) {
    console.log(`🔧 Development mode enabled`);
    console.log(`📝 Log level: ${config.logging.level}`);
  }
});



// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});



module.exports = { server, app, io };
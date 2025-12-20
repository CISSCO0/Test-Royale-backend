const express = require('express');
const cors = require('cors');
const { config } = require('./config/env');
const initializeSocketIO = require('./sockets');
const cookieParser = require('cookie-parser');

const Code = require('./models/code');
/**
 * Create and configure Express application
 * @param {Object} server - HTTP server instance (optional)
 * @returns {Object} Configured Express app and Socket.io instance
 */
function createApp(server = null) {
  const app = express();

  // CORS configuration - allow specific origins with credentials
  const corsOptions = {
    origin: [
      'http://localhost:3000',
      'https://test-royale.vercel.app',
      'https://test-royale-36skzytqz-cissco0s-projects.vercel.app',
      /^https:\/\/test-royale-.*\.vercel\.app$/
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400
  };

  // Middleware
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // CORS debugging middleware
  app.use((req, res, next) => {
    if (config.logging.enableConsole) {

    }
    next();
  });

  // Request logging middleware
  app.use((req, res, next) => {
    if (config.logging.enableConsole) {

    }
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: 'v1.0.2-cors-fixed',
      commit: 'b98065f',
      corsOrigin: process.env.CORS_ORIGIN || 'not set'
    });
  });

  // CORS debug endpoint
  app.get('/api/cors-config', (req, res) => {
    res.json({
      configuredOrigins: config.socket.cors.origin,
      clientUrlEnv: process.env.CLIENT_URL || 'not set',
      requestOrigin: req.headers.origin || 'no origin header',
      timestamp: new Date().toISOString()
    });
  });

  // API routes
  app.get('/api/status', (req, res) => {
    res.json({
      message: 'Game server is running',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Game statistics endpoint
  app.get('/api/stats', (req, res) => {
    // This would be populated by the room service
    res.json({
      message: 'Game statistics',
      timestamp: new Date().toISOString(),
      // Add actual stats here when room service is available
    });
  });

  //Routes
  const authRoutes = require('./routes/authRoutes');
  const roomRoutes = require('./routes/roomRoutes');
  const codeRoutes = require('./routes/codeRoutes')
  const gameRoutes = require('./routes/gameRoutes');
  app.use('/api/rooms',roomRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/code', codeRoutes);
  app.use('/api/game', gameRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not found',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    res.status(err.status || 500).json({
      error: 'Internal server error',
      message: config.development.isDev ? err.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  });

  // Initialize Socket.io if server is provided
  let io = null;
  if (server) {
    io = initializeSocketIO(server);
  }

  return { app, io };
}

module.exports = createApp;
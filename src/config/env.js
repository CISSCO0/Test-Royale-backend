require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  host: process.env.HOST || 'localhost',
  
  // Client configuration
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Database configuration (if needed in future)
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/my-game',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Game configuration
  game: {
    maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM) || 4,
    roomCodeLength: parseInt(process.env.ROOM_CODE_LENGTH) || 6,
    gameTimeout: parseInt(process.env.GAME_TIMEOUT) || 3600000, // 1 hour in ms
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL) || 300000 // 5 minutes in ms
  },
  
  // Socket.io configuration
  socket: {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      credentials: false, // Must be false when origin is '*'
      maxAge: 86400 // 24 hours
    },
    transports: ['websocket', 'polling']
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
    enableFile: process.env.ENABLE_FILE_LOGGING === 'true'
  },
  
  // Security configuration
  security: {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // requests per window
    }
  },
  
  // Development configuration
  development: {
    isDev: process.env.NODE_ENV !== 'production',
    enableHotReload: process.env.ENABLE_HOT_RELOAD === 'true'
  }
};

/**
 * Validate required environment variables
 */
function validateConfig() {
  const required = [];
  
  // Add any required environment variables here
  // if (!process.env.SOME_REQUIRED_VAR) {
  //   required.push('SOME_REQUIRED_VAR');
  // }
  
  if (required.length > 0) {
    throw new Error(`Missing required environment variables: ${required.join(', ')}`);
  }
}

/**
 * Get configuration for a specific environment
 * @param {string} env - Environment name
 * @returns {Object} Environment-specific configuration
 */
function getConfigForEnv(env = process.env.NODE_ENV || 'development') {
  const baseConfig = { ...config };
  
  switch (env) {
    case 'production':
      return {
        ...baseConfig,
        logging: {
          ...baseConfig.logging,
          level: 'warn'
        },
        development: {
          ...baseConfig.development,
          isDev: false,
          enableHotReload: false
        }
      };
      
    case 'test':
      return {
        ...baseConfig,
        port: process.env.TEST_PORT || 3002,
        game: {
          ...baseConfig.game,
          maxPlayersPerRoom: 2,
          roomCodeLength: 4
        }
      };
      
    case 'development':
    default:
      return baseConfig;
  }
}

module.exports = {
  config: getConfigForEnv(),
  validateConfig,
  getConfigForEnv
};
// middleware/authMiddleware.js
const AuthService = require('../services/authService');
const authService = new AuthService();

const authMiddleware = async (req, res, next) => {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = req.cookies.auth_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const verified = authService.verifyToken(token);
    if (!verified.success) {

      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }

    req.playerId = verified.playerId;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

module.exports = authMiddleware;
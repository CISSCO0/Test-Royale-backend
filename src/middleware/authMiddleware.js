// middleware/authMiddleware.js
const AuthService = require('../services/authService');
const authService = new AuthService();

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const verified = authService.verifyToken(token);
    if (!verified.success) {
      console.log("Token verification failed:", token);
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
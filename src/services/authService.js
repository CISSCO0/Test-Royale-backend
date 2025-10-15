const Player = require('../models/player');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiry = process.env.JWT_EXPIRY || '24h';
    this.cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
  }

  /**
   * Register a new player
   * @param {Object} playerData - Player registration data
   * @param {Object} res - Express response object
   * @returns {Object} Registration result
   */
  async register(playerData, res) {
    try {
      const { email, password, name } = playerData;

      // Validate input
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters long'
        };
      }
 
      // Check if player already exists
      const existingPlayer = await Player.findOne({ email });
      if (existingPlayer) {
        return {
          success: false,
          error: 'Player with this email already exists'
        };
      }

      // Create new player
      const player = new Player({
        email,
        password,
        name: name || 'Unknown Player'
      });

      await player.save();
      // Generate JWT token and set cookie
      const token = this.generateToken(player._id);
      
      // Make sure res object exists before using it
      if (res && typeof res.cookie === 'function') {
        res.cookie('auth_token', token, this.cookieOptions);
      }

      return {
        success: true,
        player: {
          id: player._id,
          email: player.email,
          name: player.name,
          totalScore: player.totalScore,
          totalGamesPlayed: player.totalGamesPlayed,
          winRate: player.winRate
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Login a player
   * @param {Object} credentials - Login credentials
   * @param {Object} res - Express response object
   * @returns {Object} Login result
   */
  async login(credentials, res) {
    try {
      const { email, password } = credentials;

      // Validate input
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      // Find player by email
      const player = await Player.findOne({ email });
      if (!player) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check password
      const isPasswordValid = await player.comparePassword(password);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Generate JWT token and set cookie
      const token = this.generateToken(player._id);
      
      // Make sure res object exists before using it
      if (res && typeof res.cookie === 'function') {
        res.cookie('auth_token', token, this.cookieOptions);
      }

      return {
        success: true,
        token, // Include token in response
        player: {
          id: player._id,
          email: player.email,
          name: player.name,
          totalScore: player.totalScore,
          totalGamesPlayed: player.totalGamesPlayed,
          winRate: player.winRate
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred during login'
      };
    }
  }

  /**
   * Logout a player
   * @param {string} playerId - Player ID
   * @param {Object} res - Express response object
   * @returns {Object} Logout result
   */
  async logout(playerId, res) {
    try {
      // Update last active
      await Player.findByIdAndUpdate(playerId, { lastActive: new Date() });

      // Clear the auth cookie
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate JWT token
   * @param {string} playerId - Player ID
   * @returns {string} JWT token
   */
  generateToken(playerId) {
    return jwt.sign(
      { playerId },
      this.jwtSecret,
      { expiresIn: this.jwtExpiry }
    );
  }

  /**
   * Verify JWT token from cookie
   * @param {string} token - JWT token
   * @returns {Object} Verification result
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return {
        success: true,
        playerId: decoded.playerId
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid token'
      };
    }
  }

  /**
   * Get player profile
   * @param {string} playerId - Player ID
   * @returns {Object} Player profile
   */
  async getProfile(playerId) {
    try {
      

      const player = await Player.findById(playerId).select('-password');
       
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }
      console.log(player);
      return {
        success: true,
        player: {
          id: player._id,
          email: player.email,
          name: player.name,
          totalScore: player.totalScore,
          totalGamesPlayed: player.totalGamesPlayed,
          totalGamesWon: player.totalGamesWon,
          winRate: player.winRate,
          averageScore: player.averageScore,
          bestStreak: player.bestStreak,
          bestScore: player.bestScore,
          currentStreak: player.currentStreak,
          achievements: player.achievements,
          badges: player.badges,
          joinedAt: player.joinedAt,
          lastActive: player.lastActive
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update player profile
   * @param {string} playerId - Player ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Update result
   */
  async updateProfile(playerId, updateData) {
    try {
      const allowedUpdates = ['name'];
      const updates = {};

      // Only allow certain fields to be updated
      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        return {
          success: false,
          error: 'No valid fields to update'
        };
      }

      const player = await Player.findByIdAndUpdate(
        playerId,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      return {
        success: true,
        player: {
          id: player._id,
          email: player.email,
          name: player.name,
          totalScore: player.totalScore,
          totalGamesPlayed: player.totalGamesPlayed,
          winRate: player.winRate
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Change player password
   * @param {string} playerId - Player ID
   * @param {Object} passwordData - Password change data
   * @returns {Object} Password change result
   */
  async changePassword(playerId, passwordData) {
    try {
      const { currentPassword, newPassword } = passwordData;

      if (!currentPassword || !newPassword) {
        return {
          success: false,
          error: 'Current password and new password are required'
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          error: 'New password must be at least 6 characters long'
        };
      }

      const player = await Player.findById(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await player.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Update password
      player.password = newPassword;
      await player.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = AuthService;
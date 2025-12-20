const Player = require('../models/player');
const jwt = require('jsonwebtoken');
const sendEmail = require('./nodemailerService');
const TempCode = require('../models/tempCode');
class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiry = process.env.JWT_EXPIRY || '24h';
    const isProduction = process.env.NODE_ENV === 'production';
    this.cookieOptions = {
      httpOnly: true,
      secure: isProduction, // Must be true when sameSite is 'none'
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 , // 7 days
      path: "/"  
    };
  }

  /**
   * Register a new player (direct registration without email verification)
   * @param {*} playerData 
   * @returns 
   */
  async register(playerData) {
    const { email, password, name } = playerData;

    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    const existingPlayer = await Player.findOne({ email });
    if (existingPlayer) {
      return { success: false, error: "Email already registered" };
    }

    const player = new Player({
      email,
      password,
      name: name || "Unknown Player"
    });

    await player.save();

    const token = this.generateToken(player._id);

    return {
      success: true,
      token,
      player: {
        _id: player._id,
        email: player.email,
        name: player.name,
        totalScore: player.totalScore,
        averageScore: player.averageScore
      }
    };
  }

  /**
   * Start registration with email verification (deprecated - keeping for compatibility)
   */
  async startRegistration(playerData) {
  const { email, password, name } = playerData;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const existingPlayer = await Player.findOne({ email });
  if (existingPlayer) {
    return { success: false, error: "Email already registered before " };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await TempCode.findOneAndUpdate(
    { email },
    { email, password, name, code, expiresAt: Date.now() + 5 * 60 * 1000 },
    { upsert: true }
  );

  const emailResult = await sendEmail(
  email,
  `Hello,

Thank you for registering at Warrior Arena! 

Please use the following verification code to complete your registration:

${code}

This code will expire in 5 minutes.

If you did not sign up for an account, please ignore this email.

See you in the battle!
- The Warrior Arena Team`
);

  // Even if email fails, allow registration to proceed (code is logged for manual verification)
  if (!emailResult.success) {
    console.warn(`⚠️ Email delivery failed for ${email}, but registration can proceed`);
  }

  return { success: true, message: "Verification code sent", code: process.env.NODE_ENV === 'development' ? code : undefined };
}

async verifyRegistration(email, code, res) {
  const record = await TempCode.findOne({ email });

  if (!record) {
    return { success: false, error: "No pending registration" };
  }

  // Allow bypass code "000000" when SMTP is not configured (for testing/demo)
  const isValidCode = record.code === code || 
    (!process.env.SMTP_EMAIL && code === "000000");

  if (!isValidCode) {
    return { success: false, error: "Invalid code" };
  }

  if (record.expiresAt < Date.now()) {
    return { success: false, error: "Code expired" };
  }

  const player = new Player({
    email: record.email,
    password: record.password,
    name: record.name || "Unknown Player"
  });

  await player.save();
  await TempCode.deleteOne({ email });

  const token = this.generateToken(player._id);
  if (res && res.cookie) {
    res.cookie("auth_token", token, this.cookieOptions);
  }

  return {
    success: true,
    token,
    player: {
      playerId: player._id,
      email: player.email,
      name: player.name,
      totalScore: player.totalScore,
      totalGamesPlayed: player.totalGamesPlayed,
      winRate: player.winRate
    }
  };
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
          playerId: player._id,
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
        sameSite: 'strict' ,
        path: "/" 
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

      return {
        success: true,
        player: {
          playerId: player._id,
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
          playerId: player._id,
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
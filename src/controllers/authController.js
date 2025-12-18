// controllers/authController.js
const AuthService = require('../services/authService');
const authService = new AuthService();

class AuthController {
  
  // POST /api/auth/start-registration
  async startRegistration(req, res) {
    try {
      console.log("Received registration data:", req.body);
      const result = await authService.startRegistration(req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result);

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/auth/verify-registration
  async verifyRegistration(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          error: "Email and code are required"
        });
      }

      const result = await authService.verifyRegistration(email, code, res);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result);

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }


  // POST /api/auth/login
  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message })     ;
    }
  }

  // GET /api/auth/profile  (protected route)
  async getProfile(req, res) {
    try {
      const player = await authService.getProfile(req.playerId);
      if (!player) return res.status(404).json({ error: 'Player not found' });
      return res.status(200).json(player);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/auth/logout
  async logout(req, res) {
    try {
   
     const logoutResult = await authService.logout(req.playerId,res);
      if (!logoutResult.success) return res.status(400).json({ error: logoutResult.error
      });
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    } 
  }
    /**
   * Get player information
   * @param {string} playerId - Socket ID of the player
   * @returns {Object} Player data or error
   */
  async getPlayer(req, res) {
    try {
      const playerId = req.params.playerId;
      const player = await this.playerService.getPlayer(playerId);
      return res.status(200).json(player);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AuthController();

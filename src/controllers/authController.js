// controllers/authController.js
const AuthService = require('../services/authService');
const authService = new AuthService();

class AuthController {

  // POST /api/auth/register
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      return res.status(201).json(result);
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
}

module.exports = new AuthController();

const Player = require('../models/player');
const Achievement = require('../models/achievement');
const Badge = require('../models/badge');

class PlayerService {
  constructor() {
  }

  /**
   * Get player by ID
   * @param {string} playerId - Player ID
   * @returns {Object} Player data or error
   */
  async getPlayer(playerId) {
    try {
      const player = await Player.findById(playerId)
        .populate('achievements')
        .populate('badges')
        .select('-password');

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
          averageScore: player.averageScore,
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

}

module.exports = PlayerService;
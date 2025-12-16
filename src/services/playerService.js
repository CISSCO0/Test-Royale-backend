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
          totalGamesPlayed: player.totalGamesPlayed,
          totalGamesWon: player.totalGamesWon,
          winRate: player.winRate,
          averageScore: player.averageScore,
          bestStreak: player.bestStreak,
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


  //-------------------------------------------------------------------------------
  /**
   * Get player by email
   * @param {string} email - Player email
   * @returns {Object} Player data or error
   */
  async getPlayerByEmail(email) {
    try {
      const player = await Player.findOne({ email })
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
          totalGamesPlayed: player.totalGamesPlayed,
          totalGamesWon: player.totalGamesWon,
          winRate: player.winRate,
          averageScore: player.averageScore,
          bestStreak: player.bestStreak,
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
   * Update player statistics after game completion
   * @param {string} playerId - Player ID
   * @param {Object} gameResult - Game result data
   * @returns {Object} Update result
   */
  async updatePlayerStats(playerId, gameResult) {
    try {
      const player = await Player.findById(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      // Update basic stats
      player.totalGamesPlayed += 1;
      player.totalScore += gameResult.score || 0;
      player.averageScore = Math.round(player.totalScore / player.totalGamesPlayed);

      // Update win/loss
      if (gameResult.won) {
        player.totalGamesWon += 1;
        player.currentStreak += 1;
        player.bestStreak = Math.max(player.bestStreak, player.currentStreak);
      } else {
        player.currentStreak = 0;
      }

      // Update win rate
      player.winRate = Math.round((player.totalGamesWon / player.totalGamesPlayed) * 100);

      // Update last active
      player.lastActive = new Date();

      await player.save();

      return {
        success: true,
        player: {
          id: player._id,
          totalScore: player.totalScore,
          totalGamesPlayed: player.totalGamesPlayed,
          totalGamesWon: player.totalGamesWon,
          winRate: player.winRate,
          averageScore: player.averageScore,
          bestStreak: player.bestStreak,
          currentStreak: player.currentStreak
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
   * Update player name
   * @param {string} playerId - Player ID
   * @param {string} newName - New player name
   * @returns {Object} Update result
   */
  async updatePlayerName(playerId, newName) {
    try {
      if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid player name'
        };
      }

      const player = await Player.findByIdAndUpdate(
        playerId,
        { name: newName.trim() },
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
          name: player.name,
          email: player.email
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
   * Get player summary with statistics
   * @param {string} playerId - Player ID
   * @returns {Object} Player summary or error
   */
  async getPlayerSummary(playerId) {
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
          totalGamesPlayed: player.totalGamesPlayed,
          totalGamesWon: player.totalGamesWon,
          winRate: player.winRate,
          averageScore: player.averageScore,
          bestStreak: player.bestStreak,
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
   * Get all players with pagination
   * @param {Object} options - Query options
   * @returns {Object} List of players
   */
  async getAllPlayers(options = {}) {
    try {
      const { page = 1, limit = 50, sortBy = 'totalScore', sortOrder = -1 } = options;
      const skip = (page - 1) * limit;

      const validSortFields = ['totalScore', 'winRate', 'totalGamesPlayed', 'averageScore', 'bestStreak', 'joinedAt'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'totalScore';
      const sort = { [sortField]: sortOrder };

      const players = await Player.find({ totalGamesPlayed: { $gte: 1 } })
        .populate('achievements')
        .populate('badges')
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalPlayers = await Player.countDocuments({ totalGamesPlayed: { $gte: 1 } });

      return {
        success: true,
        players: players.map(player => ({
          id: player._id,
          email: player.email,
          name: player.name,
          totalScore: player.totalScore,
          totalGamesPlayed: player.totalGamesPlayed,
          totalGamesWon: player.totalGamesWon,
          winRate: player.winRate,
          averageScore: player.averageScore,
          bestStreak: player.bestStreak,
          currentStreak: player.currentStreak,
          achievementCount: player.achievements.length,
          badgeCount: player.badges.length,
          joinedAt: player.joinedAt,
          lastActive: player.lastActive
        })),
        pagination: {
          page,
          limit,
          totalPlayers,
          totalPages: Math.ceil(totalPlayers / limit)
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
   * Get player leaderboard
   * @param {number} limit - Number of players to return
   * @returns {Object} Sorted leaderboard
   */
  async getPlayerLeaderboard(limit = 10) {
    try {
      const players = await Player.find({ totalGamesPlayed: { $gte: 1 } })
        .populate('achievements')
        .populate('badges')
        .select('-password')
        .sort({ totalScore: -1, winRate: -1 })
        .limit(limit);

      return {
        success: true,
        leaderboard: players.map((player, index) => ({
          rank: index + 1,
          id: player._id,
          name: player.name,
          email: player.email,
          totalScore: player.totalScore,
          totalGamesPlayed: player.totalGamesPlayed,
          totalGamesWon: player.totalGamesWon,
          winRate: player.winRate,
          averageScore: player.averageScore,
          bestStreak: player.bestStreak,
          achievementCount: player.achievements.length,
          badgeCount: player.badges.length
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get player statistics
   * @returns {Object} Overall player statistics
   */
  async getPlayerStats() {
    try {
      const totalPlayers = await Player.countDocuments();
      const activePlayers = await Player.countDocuments({ 
        lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      });
      
      const totalGamesPlayed = await Player.aggregate([
        { $group: { _id: null, total: { $sum: '$totalGamesPlayed' } } }
      ]);

      const averageScore = await Player.aggregate([
        { $match: { totalGamesPlayed: { $gte: 1 } } },
        { $group: { _id: null, avgScore: { $avg: '$totalScore' } } }
      ]);

      const topPlayer = await Player.findOne({ totalGamesPlayed: { $gte: 1 } })
        .sort({ totalScore: -1 })
        .select('name totalScore totalGamesPlayed winRate');

      return {
        success: true,
        stats: {
          totalPlayers,
          activePlayers,
          totalGamesPlayed: totalGamesPlayed[0]?.total || 0,
          averageScore: Math.round(averageScore[0]?.avgScore || 0),
          topPlayer: topPlayer ? {
            name: topPlayer.name,
            totalScore: topPlayer.totalScore,
            totalGamesPlayed: topPlayer.totalGamesPlayed,
            winRate: topPlayer.winRate
          } : null
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
   * Search players
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Object} Search results
   */
  async searchPlayers(searchTerm, options = {}) {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return {
          success: false,
          error: 'Search term is required'
        };
      }

      const { limit = 20 } = options;
      const regex = new RegExp(searchTerm, 'i');

      const players = await Player.find({
        $or: [
          { name: { $regex: regex } },
          { email: { $regex: regex } }
        ],
        totalGamesPlayed: { $gte: 1 }
      })
        .populate('achievements')
        .populate('badges')
        .select('-password')
        .sort({ totalScore: -1 })
        .limit(limit);

      return {
        success: true,
        players: players.map(player => ({
          id: player._id,
          name: player.name,
          email: player.email,
          totalScore: player.totalScore,
          totalGamesPlayed: player.totalGamesPlayed,
          winRate: player.winRate,
          achievementCount: player.achievements.length,
          badgeCount: player.badges.length
        })),
        count: players.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete player
   * @param {string} playerId - Player ID
   * @returns {Object} Deletion result
   */
  async deletePlayer(playerId) {
    try {
      const player = await Player.findByIdAndDelete(playerId);
      
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      return {
        success: true,
        message: 'Player deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get players by achievement
   * @param {string} achievementId - Achievement ID
   * @param {Object} options - Query options
   * @returns {Object} Players with the achievement
   */
  async getPlayersByAchievement(achievementId, options = {}) {
    try {
      const { limit = 20 } = options;

      const players = await Player.find({ achievements: achievementId })
        .populate('achievements')
        .populate('badges')
        .select('-password')
        .sort({ totalScore: -1 })
        .limit(limit);

      return {
        success: true,
        players: players.map(player => ({
          id: player._id,
          name: player.name,
          email: player.email,
          totalScore: player.totalScore,
          totalGamesPlayed: player.totalGamesPlayed,
          winRate: player.winRate,
          achievementCount: player.achievements.length,
          badgeCount: player.badges.length
        })),
        count: players.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get players by badge
   * @param {string} badgeId - Badge ID
   * @param {Object} options - Query options
   * @returns {Object} Players with the badge
   */
  async getPlayersByBadge(badgeId, options = {}) {
    try {
      const { limit = 20 } = options;

      const players = await Player.find({ badges: badgeId })
        .populate('achievements')
        .populate('badges')
        .select('-password')
        .sort({ totalScore: -1 })
        .limit(limit);

      return {
        success: true,
        players: players.map(player => ({
          id: player._id,
          name: player.name,
          email: player.email,
          totalScore: player.totalScore,
          totalGamesPlayed: player.totalGamesPlayed,
          winRate: player.winRate,
          achievementCount: player.achievements.length,
          badgeCount: player.badges.length
        })),
        count: players.length
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
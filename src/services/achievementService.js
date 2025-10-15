const Achievement = require('../models/achievement');
const Player = require('../models/player');

class AchievementService {
  constructor() {
    this.defaultAchievements = [
      {
        name: 'First Victory',
        description: 'Win your first game',
        type: 'first_win'
      },
      {
        name: 'Win Streak Master',
        description: 'Achieve a 5-game winning streak',
        type: 'win_streak_5'
      },
      {
        name: 'Dedicated Player',
        description: 'Play 10 games',
        type: 'games_played_10'
      },
      {
        name: 'High Scorer',
        description: 'Achieve an average score of 100 or higher',
        type: 'high_score_100'
      },
      {
        name: 'Test Coverage Expert',
        description: 'Achieve 90% test coverage in a single game',
        type: 'coverage_expert'
      },
      {
        name: 'Speed Demon',
        description: 'Complete a game in under 2 minutes',
        type: 'speed_demon'
      },
      {
        name: 'Perfectionist',
        description: 'Score 100 points in a single game',
        type: 'perfectionist'
      },
      {
        name: 'Veteran',
        description: 'Play 50 games',
        type: 'veteran'
      },
      {
        name: 'Champion',
        description: 'Win 25 games',
        type: 'champion'
      },
      {
        name: 'Legend',
        description: 'Win 100 games',
        type: 'legend'
      }
    ];
  }

  /**
   * Get all achievements
   * @param {Object} filters - Filter options
   * @returns {Object} List of achievements
   */
  async getAllAchievements(filters = {}) {
    try {
      const query = {};
      
      if (filters.type) {
        query.type = filters.type;
      }

      const achievements = await Achievement.find(query)
        .sort({ createdAt: -1 });

      return {
        success: true,
        achievements: achievements.map(achievement => ({
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          type: achievement.type,
          earnedAt: achievement.earnedAt
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
   * Get a specific achievement
   * @param {string} achievementId - Achievement ID
   * @returns {Object} Achievement details
   */
  async getAchievement(achievementId) {
    try {
      const achievement = await Achievement.findById(achievementId);
      
      if (!achievement) {
        return {
          success: false,
          error: 'Achievement not found'
        };
      }

      return {
        success: true,
        achievement: {
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          type: achievement.type,
          earnedAt: achievement.earnedAt
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
   * Create a new achievement
   * @param {Object} achievementData - Achievement data
   * @returns {Object} Created achievement
   */
  async createAchievement(achievementData) {
    try {
      const { name, description, type } = achievementData;

      // Validate required fields
      if (!name || !description || !type) {
        return {
          success: false,
          error: 'Name, description, and type are required'
        };
      }

      // Check if achievement with same type already exists
      const existingAchievement = await Achievement.findOne({ type });
      if (existingAchievement) {
        return {
          success: false,
          error: 'Achievement with this type already exists'
        };
      }

      const achievement = new Achievement({
        name,
        description,
        type
      });

      await achievement.save();

      return {
        success: true,
        achievement: {
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          type: achievement.type,
          earnedAt: achievement.earnedAt
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
   * Update an achievement
   * @param {string} achievementId - Achievement ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated achievement
   */
  async updateAchievement(achievementId, updateData) {
    try {
      const allowedUpdates = ['name', 'description'];
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

      const achievement = await Achievement.findByIdAndUpdate(
        achievementId,
        updates,
        { new: true, runValidators: true }
      );

      if (!achievement) {
        return {
          success: false,
          error: 'Achievement not found'
        };
      }

      return {
        success: true,
        achievement: {
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          type: achievement.type,
          earnedAt: achievement.earnedAt
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
   * Delete an achievement
   * @param {string} achievementId - Achievement ID
   * @returns {Object} Deletion result
   */
  async deleteAchievement(achievementId) {
    try {
      const achievement = await Achievement.findByIdAndDelete(achievementId);
      
      if (!achievement) {
        return {
          success: false,
          error: 'Achievement not found'
        };
      }

      // Remove achievement from all players
      await Player.updateMany(
        { achievements: achievementId },
        { $pull: { achievements: achievementId } }
      );

      return {
        success: true,
        message: 'Achievement deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get player's achievements
   * @param {string} playerId - Player ID
   * @returns {Object} Player's achievements
   */
  async getPlayerAchievements(playerId) {
    try {
      const player = await Player.findById(playerId)
        .populate('achievements')
        .select('achievements');

      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      return {
        success: true,
        achievements: player.achievements.map(achievement => ({
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          type: achievement.type,
          earnedAt: achievement.earnedAt
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
   * Award achievement to player
   * @param {string} playerId - Player ID
   * @param {string} achievementId - Achievement ID
   * @returns {Object} Award result
   */
  async awardAchievement(playerId, achievementId) {
    try {
      const player = await Player.findById(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      const achievement = await Achievement.findById(achievementId);
      if (!achievement) {
        return {
          success: false,
          error: 'Achievement not found'
        };
      }

      // Check if player already has this achievement
      if (player.achievements.includes(achievementId)) {
        return {
          success: false,
          error: 'Player already has this achievement'
        };
      }

      // Add achievement to player
      player.achievements.push(achievementId);
      await player.save();

      return {
        success: true,
        message: 'Achievement awarded successfully',
        achievement: {
          id: achievement._id,
          name: achievement.name,
          description: achievement.description,
          type: achievement.type
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
   * Check and award achievements based on player stats
   * @param {string} playerId - Player ID
   * @param {Object} gameResult - Game result data
   * @returns {Object} New achievements awarded
   */
  async checkAndAwardAchievements(playerId, gameResult = {}) {
    try {
      const player = await Player.findById(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      const newAchievements = [];
      const achievements = await Achievement.find();

      for (const achievement of achievements) {
        // Skip if player already has this achievement
        if (player.achievements.includes(achievement._id)) continue;

        let shouldAward = false;

        switch (achievement.type) {
          case 'first_win':
            if (player.totalGamesWon >= 1) shouldAward = true;
            break;
          case 'win_streak_5':
            if (player.bestStreak >= 5) shouldAward = true;
            break;
          case 'games_played_10':
            if (player.totalGamesPlayed >= 10) shouldAward = true;
            break;
          case 'high_score_100':
            if (player.averageScore >= 100) shouldAward = true;
            break;
          case 'coverage_expert':
            if (gameResult.coverageScore && gameResult.coverageScore >= 90) shouldAward = true;
            break;
          case 'speed_demon':
            if (gameResult.gameDuration && gameResult.gameDuration <= 120) shouldAward = true;
            break;
          case 'perfectionist':
            if (gameResult.score && gameResult.score >= 100) shouldAward = true;
            break;
          case 'veteran':
            if (player.totalGamesPlayed >= 50) shouldAward = true;
            break;
          case 'champion':
            if (player.totalGamesWon >= 25) shouldAward = true;
            break;
          case 'legend':
            if (player.totalGamesWon >= 100) shouldAward = true;
            break;
        }

        if (shouldAward) {
          player.achievements.push(achievement._id);
          newAchievements.push({
            id: achievement._id,
            name: achievement.name,
            description: achievement.description,
            type: achievement.type
          });
        }
      }

      if (newAchievements.length > 0) {
        await player.save();
      }

      return {
        success: true,
        newAchievements,
        count: newAchievements.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize default achievements
   * @returns {Object} Initialization result
   */
  async initializeDefaultAchievements() {
    try {
      const existingCount = await Achievement.countDocuments();
      
      if (existingCount > 0) {
        return {
          success: true,
          message: 'Achievements already exist',
          count: existingCount
        };
      }

      const createdAchievements = [];
      
      for (const achievementData of this.defaultAchievements) {
        const achievement = new Achievement(achievementData);
        await achievement.save();
        createdAchievements.push(achievement._id);
      }

      return {
        success: true,
        message: 'Default achievements created successfully',
        count: createdAchievements.length,
        achievementIds: createdAchievements
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get achievement statistics
   * @returns {Object} Achievement statistics
   */
  async getAchievementStats() {
    try {
      const totalAchievements = await Achievement.countDocuments();
      
      const typeStats = await Achievement.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Get most earned achievement
      const mostEarnedAchievement = await Player.aggregate([
        { $unwind: '$achievements' },
        {
          $group: {
            _id: '$achievements',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 1
        },
        {
          $lookup: {
            from: 'achievements',
            localField: '_id',
            foreignField: '_id',
            as: 'achievement'
          }
        },
        {
          $unwind: '$achievement'
        }
      ]);

      return {
        success: true,
        stats: {
          totalAchievements,
          typeStats,
          mostEarnedAchievement: mostEarnedAchievement.length > 0 ? mostEarnedAchievement[0] : null
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
   * Get achievement leaderboard
   * @param {number} limit - Number of players to return
   * @returns {Object} Achievement leaderboard
   */
  async getAchievementLeaderboard(limit = 10) {
    try {
      const leaderboard = await Player.aggregate([
        {
          $project: {
            name: 1,
            email: 1,
            achievementCount: { $size: '$achievements' },
            totalScore: 1,
            totalGamesPlayed: 1,
            winRate: 1
          }
        },
        {
          $sort: { achievementCount: -1, totalScore: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return {
        success: true,
        leaderboard: leaderboard.map((player, index) => ({
          rank: index + 1,
          playerId: player._id,
          name: player.name,
          email: player.email,
          achievementCount: player.achievementCount,
          totalScore: player.totalScore,
          totalGamesPlayed: player.totalGamesPlayed,
          winRate: player.winRate
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = AchievementService;
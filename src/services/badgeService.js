const Badge = require('../models/badge');
const Player = require('../models/player');

class BadgeService {
  constructor() {
    this.defaultBadges = [
      {
        name: 'Hot Streak',
        description: 'Win 3 games in a row',
        condition: 'win_streak_3',
        icon: '🔥'
      },
      {
        name: 'Rookie',
        description: 'Play your first 5 games',
        condition: 'games_played_5',
        icon: '🌱'
      },
      {
        name: 'Consistent Winner',
        description: 'Maintain 80% win rate',
        condition: 'high_win_rate',
        icon: '🎯'
      },
      {
        name: 'Speed Runner',
        description: 'Complete a game in under 1 minute',
        condition: 'speed_runner',
        icon: '⚡'
      },
      {
        name: 'Test Master',
        description: 'Achieve perfect test coverage',
        condition: 'perfect_coverage',
        icon: '🧪'
      },
      {
        name: 'Code Warrior',
        description: 'Win 10 games',
        condition: 'wins_10',
        icon: '⚔️'
      },
      {
        name: 'Marathon Player',
        description: 'Play for 2 hours straight',
        condition: 'marathon_player',
        icon: '🏃'
      },
      {
        name: 'Night Owl',
        description: 'Play a game after midnight',
        condition: 'night_owl',
        icon: '🦉'
      },
      {
        name: 'Early Bird',
        description: 'Play a game before 6 AM',
        condition: 'early_bird',
        icon: '🐦'
      },
      {
        name: 'Weekend Warrior',
        description: 'Play 5 games on a weekend',
        condition: 'weekend_warrior',
        icon: '🏆'
      }
    ];
  }

  /**
   * Get all badges
   * @param {Object} filters - Filter options
   * @returns {Object} List of badges
   */
  async getAllBadges(filters = {}) {
    try {
      const query = {};
      
      if (filters.condition) {
        query.condition = filters.condition;
      }

      const badges = await Badge.find(query)
        .sort({ createdAt: -1 });

      return {
        success: true,
        badges: badges.map(badge => ({
          id: badge._id,
          name: badge.name,
          description: badge.description,
          condition: badge.condition,
          icon: badge.icon
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
   * Get a specific badge
   * @param {string} badgeId - Badge ID
   * @returns {Object} Badge details
   */
  async getBadge(badgeId) {
    try {
      const badge = await Badge.findById(badgeId);
      
      if (!badge) {
        return {
          success: false,
          error: 'Badge not found'
        };
      }

      return {
        success: true,
        badge: {
          id: badge._id,
          name: badge.name,
          description: badge.description,
          condition: badge.condition,
          icon: badge.icon
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
   * Create a new badge
   * @param {Object} badgeData - Badge data
   * @returns {Object} Created badge
   */
  async createBadge(badgeData) {
    try {
      const { name, description, condition, icon } = badgeData;

      // Validate required fields
      if (!name || !description || !condition) {
        return {
          success: false,
          error: 'Name, description, and condition are required'
        };
      }

      // Check if badge with same condition already exists
      const existingBadge = await Badge.findOne({ condition });
      if (existingBadge) {
        return {
          success: false,
          error: 'Badge with this condition already exists'
        };
      }

      const badge = new Badge({
        name,
        description,
        condition,
        icon: icon || '🏆'
      });

      await badge.save();

      return {
        success: true,
        badge: {
          id: badge._id,
          name: badge.name,
          description: badge.description,
          condition: badge.condition,
          icon: badge.icon
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
   * Update a badge
   * @param {string} badgeId - Badge ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated badge
   */
  async updateBadge(badgeId, updateData) {
    try {
      const allowedUpdates = ['name', 'description', 'icon'];
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

      const badge = await Badge.findByIdAndUpdate(
        badgeId,
        updates,
        { new: true, runValidators: true }
      );

      if (!badge) {
        return {
          success: false,
          error: 'Badge not found'
        };
      }

      return {
        success: true,
        badge: {
          id: badge._id,
          name: badge.name,
          description: badge.description,
          condition: badge.condition,
          icon: badge.icon
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
   * Delete a badge
   * @param {string} badgeId - Badge ID
   * @returns {Object} Deletion result
   */
  async deleteBadge(badgeId) {
    try {
      const badge = await Badge.findByIdAndDelete(badgeId);
      
      if (!badge) {
        return {
          success: false,
          error: 'Badge not found'
        };
      }

      // Remove badge from all players
      await Player.updateMany(
        { badges: badgeId },
        { $pull: { badges: badgeId } }
      );

      return {
        success: true,
        message: 'Badge deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get player's badges
   * @param {string} playerId - Player ID
   * @returns {Object} Player's badges
   */
  async getPlayerBadges(playerId) {
    try {
      const player = await Player.findById(playerId)
        .populate('badges')
        .select('badges');

      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      return {
        success: true,
        badges: player.badges.map(badge => ({
          id: badge._id,
          name: badge.name,
          description: badge.description,
          condition: badge.condition,
          icon: badge.icon
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
   * Award badge to player
   * @param {string} playerId - Player ID
   * @param {string} badgeId - Badge ID
   * @returns {Object} Award result
   */
  async awardBadge(playerId, badgeId) {
    try {
      const player = await Player.findById(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      const badge = await Badge.findById(badgeId);
      if (!badge) {
        return {
          success: false,
          error: 'Badge not found'
        };
      }

      // Check if player already has this badge
      if (player.badges.includes(badgeId)) {
        return {
          success: false,
          error: 'Player already has this badge'
        };
      }

      // Add badge to player
      player.badges.push(badgeId);
      await player.save();

      return {
        success: true,
        message: 'Badge awarded successfully',
        badge: {
          id: badge._id,
          name: badge.name,
          description: badge.description,
          condition: badge.condition,
          icon: badge.icon
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
   * Check and award badges based on player stats and game events
   * @param {string} playerId - Player ID
   * @param {Object} gameResult - Game result data
   * @param {Object} playerStats - Current player stats
   * @returns {Object} New badges awarded
   */
  async checkAndAwardBadges(playerId, gameResult = {}, playerStats = {}) {
    try {
      const player = await Player.findById(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      const newBadges = [];
      const badges = await Badge.find();

      for (const badge of badges) {
        // Skip if player already has this badge
        if (player.badges.includes(badge._id)) continue;

        let shouldAward = false;

        switch (badge.condition) {
          case 'win_streak_3':
            if (player.currentStreak >= 3) shouldAward = true;
            break;
          case 'games_played_5':
            if (player.totalGamesPlayed >= 5) shouldAward = true;
            break;
          case 'high_win_rate':
            if (player.winRate >= 80) shouldAward = true;
            break;
          case 'speed_runner':
            if (gameResult.gameDuration && gameResult.gameDuration <= 60) shouldAward = true;
            break;
          case 'perfect_coverage':
            if (gameResult.coverageScore && gameResult.coverageScore >= 100) shouldAward = true;
            break;
          case 'wins_10':
            if (player.totalGamesWon >= 10) shouldAward = true;
            break;
          case 'marathon_player':
            // This would need to be tracked separately
            if (playerStats.playSessionDuration && playerStats.playSessionDuration >= 7200) shouldAward = true;
            break;
          case 'night_owl':
            const currentHour = new Date().getHours();
            if (currentHour >= 0 && currentHour < 6) shouldAward = true;
            break;
          case 'early_bird':
            const hour = new Date().getHours();
            if (hour >= 6 && hour < 12) shouldAward = true;
            break;
          case 'weekend_warrior':
            // This would need to be tracked separately
            if (playerStats.weekendGames && playerStats.weekendGames >= 5) shouldAward = true;
            break;
        }

        if (shouldAward) {
          player.badges.push(badge._id);
          newBadges.push({
            id: badge._id,
            name: badge.name,
            description: badge.description,
            condition: badge.condition,
            icon: badge.icon
          });
        }
      }

      if (newBadges.length > 0) {
        await player.save();
      }

      return {
        success: true,
        newBadges,
        count: newBadges.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize default badges
   * @returns {Object} Initialization result
   */
  async initializeDefaultBadges() {
    try {
      const existingCount = await Badge.countDocuments();
      
      if (existingCount > 0) {
        return {
          success: true,
          message: 'Badges already exist',
          count: existingCount
        };
      }

      const createdBadges = [];
      
      for (const badgeData of this.defaultBadges) {
        const badge = new Badge(badgeData);
        await badge.save();
        createdBadges.push(badge._id);
      }

      return {
        success: true,
        message: 'Default badges created successfully',
        count: createdBadges.length,
        badgeIds: createdBadges
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get badge statistics
   * @returns {Object} Badge statistics
   */
  async getBadgeStats() {
    try {
      const totalBadges = await Badge.countDocuments();
      
      const conditionStats = await Badge.aggregate([
        {
          $group: {
            _id: '$condition',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Get most earned badge
      const mostEarnedBadge = await Player.aggregate([
        { $unwind: '$badges' },
        {
          $group: {
            _id: '$badges',
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
            from: 'badges',
            localField: '_id',
            foreignField: '_id',
            as: 'badge'
          }
        },
        {
          $unwind: '$badge'
        }
      ]);

      return {
        success: true,
        stats: {
          totalBadges,
          conditionStats,
          mostEarnedBadge: mostEarnedBadge.length > 0 ? mostEarnedBadge[0] : null
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
   * Get badge leaderboard
   * @param {number} limit - Number of players to return
   * @returns {Object} Badge leaderboard
   */
  async getBadgeLeaderboard(limit = 10) {
    try {
      const leaderboard = await Player.aggregate([
        {
          $project: {
            name: 1,
            email: 1,
            badgeCount: { $size: '$badges' },
            totalScore: 1,
            totalGamesPlayed: 1,
            winRate: 1
          }
        },
        {
          $sort: { badgeCount: -1, totalScore: -1 }
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
          badgeCount: player.badgeCount,
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

  /**
   * Get badges by condition
   * @param {string} condition - Badge condition
   * @returns {Object} Badges with the condition
   */
  async getBadgesByCondition(condition) {
    try {
      const badges = await Badge.find({ condition });

      return {
        success: true,
        badges: badges.map(badge => ({
          id: badge._id,
          name: badge.name,
          description: badge.description,
          condition: badge.condition,
          icon: badge.icon
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

module.exports = BadgeService;
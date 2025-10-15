const Player = require('../models/player');
const Game = require('../models/game');

class LeaderboardService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get overall leaderboard
   * @param {Object} options - Leaderboard options
   * @returns {Object} Overall leaderboard
   */
  async getOverallLeaderboard(options = {}) {
    try {
      const { limit = 50, sortBy = 'totalScore' } = options;
      
      const validSortFields = ['totalScore', 'winRate', 'totalGamesPlayed', 'averageScore', 'bestStreak'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'totalScore';
      
      const sortOrder = sortBy === 'totalGamesPlayed' ? 1 : -1; // Ascending for games played, descending for others

      const leaderboard = await Player.aggregate([
        {
          $match: {
            totalGamesPlayed: { $gte: 1 } // Only include players who have played at least one game
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            totalScore: 1,
            totalGamesPlayed: 1,
            totalGamesWon: 1,
            winRate: 1,
            averageScore: 1,
            bestStreak: 1,
            currentStreak: 1,
            joinedAt: 1,
            lastActive: 1,
            achievementCount: { $size: '$achievements' },
            badgeCount: { $size: '$badges' }
          }
        },
        {
          $sort: { [sortField]: sortOrder, totalScore: -1 }
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
          totalScore: player.totalScore,
          totalGamesPlayed: player.totalGamesPlayed,
          totalGamesWon: player.totalGamesWon,
          winRate: player.winRate,
          averageScore: player.averageScore,
          bestStreak: player.bestStreak,
          currentStreak: player.currentStreak,
          achievementCount: player.achievementCount,
          badgeCount: player.badgeCount,
          joinedAt: player.joinedAt,
          lastActive: player.lastActive
        })),
        sortBy: sortField,
        totalPlayers: leaderboard.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get weekly leaderboard
   * @param {Object} options - Leaderboard options
   * @returns {Object} Weekly leaderboard
   */
  async getWeeklyLeaderboard(options = {}) {
    try {
      const { limit = 50 } = options;
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const leaderboard = await Player.aggregate([
        {
          $lookup: {
            from: 'games',
            let: { playerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $gte: ['$startedAt', oneWeekAgo] },
                      { $in: ['$$playerId', '$players.playerId'] }
                    ]
                  }
                }
              },
              {
                $unwind: '$players'
              },
              {
                $match: {
                  'players.playerId': '$$playerId'
                }
              }
            ],
            as: 'weeklyGames'
          }
        },
        {
          $addFields: {
            weeklyScore: {
              $sum: '$weeklyGames.players.score'
            },
            weeklyGamesPlayed: {
              $size: '$weeklyGames'
            },
            weeklyWins: {
              $sum: {
                $cond: [
                  { $eq: ['$weeklyGames.winner', '$_id'] },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $match: {
            weeklyGamesPlayed: { $gte: 1 }
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            weeklyScore: 1,
            weeklyGamesPlayed: 1,
            weeklyWins: 1,
            weeklyWinRate: {
              $cond: [
                { $gt: ['$weeklyGamesPlayed', 0] },
                { $multiply: [{ $divide: ['$weeklyWins', '$weeklyGamesPlayed'] }, 100] },
                0
              ]
            }
          }
        },
        {
          $sort: { weeklyScore: -1, weeklyWinRate: -1 }
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
          weeklyScore: player.weeklyScore,
          weeklyGamesPlayed: player.weeklyGamesPlayed,
          weeklyWins: player.weeklyWins,
          weeklyWinRate: Math.round(player.weeklyWinRate)
        })),
        period: 'weekly',
        totalPlayers: leaderboard.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get monthly leaderboard
   * @param {Object} options - Leaderboard options
   * @returns {Object} Monthly leaderboard
   */
  async getMonthlyLeaderboard(options = {}) {
    try {
      const { limit = 50 } = options;
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const leaderboard = await Player.aggregate([
        {
          $lookup: {
            from: 'games',
            let: { playerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $gte: ['$startedAt', oneMonthAgo] },
                      { $in: ['$$playerId', '$players.playerId'] }
                    ]
                  }
                }
              },
              {
                $unwind: '$players'
              },
              {
                $match: {
                  'players.playerId': '$$playerId'
                }
              }
            ],
            as: 'monthlyGames'
          }
        },
        {
          $addFields: {
            monthlyScore: {
              $sum: '$monthlyGames.players.score'
            },
            monthlyGamesPlayed: {
              $size: '$monthlyGames'
            },
            monthlyWins: {
              $sum: {
                $cond: [
                  { $eq: ['$monthlyGames.winner', '$_id'] },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $match: {
            monthlyGamesPlayed: { $gte: 1 }
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            monthlyScore: 1,
            monthlyGamesPlayed: 1,
            monthlyWins: 1,
            monthlyWinRate: {
              $cond: [
                { $gt: ['$monthlyGamesPlayed', 0] },
                { $multiply: [{ $divide: ['$monthlyWins', '$monthlyGamesPlayed'] }, 100] },
                0
              ]
            }
          }
        },
        {
          $sort: { monthlyScore: -1, monthlyWinRate: -1 }
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
          monthlyScore: player.monthlyScore,
          monthlyGamesPlayed: player.monthlyGamesPlayed,
          monthlyWins: player.monthlyWins,
          monthlyWinRate: Math.round(player.monthlyWinRate)
        })),
        period: 'monthly',
        totalPlayers: leaderboard.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get player's ranking
   * @param {string} playerId - Player ID
   * @param {string} type - Leaderboard type (overall, weekly, monthly)
   * @returns {Object} Player's ranking
   */
  async getPlayerRanking(playerId, type = 'overall') {
    try {
      const player = await Player.findById(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      let ranking;
      switch (type) {
        case 'weekly':
          ranking = await this.getWeeklyPlayerRanking(playerId);
          break;
        case 'monthly':
          ranking = await this.getMonthlyPlayerRanking(playerId);
          break;
        default:
          ranking = await this.getOverallPlayerRanking(playerId);
      }

      return {
        success: true,
        player: {
          id: player._id,
          name: player.name,
          email: player.email
        },
        ranking,
        type
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get overall player ranking
   * @param {string} playerId - Player ID
   * @returns {Object} Player's overall ranking
   */
  async getOverallPlayerRanking(playerId) {
    try {
      const player = await Player.findById(playerId);
      if (!player) return null;

      const playersWithHigherScore = await Player.countDocuments({
        totalScore: { $gt: player.totalScore }
      });

      const totalPlayers = await Player.countDocuments({
        totalGamesPlayed: { $gte: 1 }
      });

      return {
        rank: playersWithHigherScore + 1,
        totalPlayers,
        percentile: Math.round(((totalPlayers - playersWithHigherScore) / totalPlayers) * 100),
        score: player.totalScore,
        gamesPlayed: player.totalGamesPlayed,
        winRate: player.winRate
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get weekly player ranking
   * @param {string} playerId - Player ID
   * @returns {Object} Player's weekly ranking
   */
  async getWeeklyPlayerRanking(playerId) {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const weeklyStats = await Player.aggregate([
        { $match: { _id: playerId } },
        {
          $lookup: {
            from: 'games',
            let: { playerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $gte: ['$startedAt', oneWeekAgo] },
                      { $in: ['$$playerId', '$players.playerId'] }
                    ]
                  }
                }
              },
              {
                $unwind: '$players'
              },
              {
                $match: {
                  'players.playerId': '$$playerId'
                }
              }
            ],
            as: 'weeklyGames'
          }
        },
        {
          $addFields: {
            weeklyScore: { $sum: '$weeklyGames.players.score' },
            weeklyGamesPlayed: { $size: '$weeklyGames' }
          }
        }
      ]);

      if (!weeklyStats.length || weeklyStats[0].weeklyGamesPlayed === 0) {
        return null;
      }

      const playerWeeklyScore = weeklyStats[0].weeklyScore;

      const playersWithHigherWeeklyScore = await Player.aggregate([
        {
          $lookup: {
            from: 'games',
            let: { playerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $gte: ['$startedAt', oneWeekAgo] },
                      { $in: ['$$playerId', '$players.playerId'] }
                    ]
                  }
                }
              },
              {
                $unwind: '$players'
              },
              {
                $match: {
                  'players.playerId': '$$playerId'
                }
              }
            ],
            as: 'weeklyGames'
          }
        },
        {
          $addFields: {
            weeklyScore: { $sum: '$weeklyGames.players.score' },
            weeklyGamesPlayed: { $size: '$weeklyGames' }
          }
        },
        {
          $match: {
            weeklyGamesPlayed: { $gte: 1 },
            weeklyScore: { $gt: playerWeeklyScore }
          }
        },
        {
          $count: 'count'
        }
      ]);

      const totalWeeklyPlayers = await Player.aggregate([
        {
          $lookup: {
            from: 'games',
            let: { playerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $gte: ['$startedAt', oneWeekAgo] },
                      { $in: ['$$playerId', '$players.playerId'] }
                    ]
                  }
                }
              },
              {
                $unwind: '$players'
              },
              {
                $match: {
                  'players.playerId': '$$playerId'
                }
              }
            ],
            as: 'weeklyGames'
          }
        },
        {
          $addFields: {
            weeklyGamesPlayed: { $size: '$weeklyGames' }
          }
        },
        {
          $match: {
            weeklyGamesPlayed: { $gte: 1 }
          }
        },
        {
          $count: 'count'
        }
      ]);

      const higherScoreCount = playersWithHigherWeeklyScore[0]?.count || 0;
      const totalPlayers = totalWeeklyPlayers[0]?.count || 1;

      return {
        rank: higherScoreCount + 1,
        totalPlayers,
        percentile: Math.round(((totalPlayers - higherScoreCount) / totalPlayers) * 100),
        score: playerWeeklyScore,
        gamesPlayed: weeklyStats[0].weeklyGamesPlayed
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get monthly player ranking
   * @param {string} playerId - Player ID
   * @returns {Object} Player's monthly ranking
   */
  async getMonthlyPlayerRanking(playerId) {
    try {
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const monthlyStats = await Player.aggregate([
        { $match: { _id: playerId } },
        {
          $lookup: {
            from: 'games',
            let: { playerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $gte: ['$startedAt', oneMonthAgo] },
                      { $in: ['$$playerId', '$players.playerId'] }
                    ]
                  }
                }
              },
              {
                $unwind: '$players'
              },
              {
                $match: {
                  'players.playerId': '$$playerId'
                }
              }
            ],
            as: 'monthlyGames'
          }
        },
        {
          $addFields: {
            monthlyScore: { $sum: '$monthlyGames.players.score' },
            monthlyGamesPlayed: { $size: '$monthlyGames' }
          }
        }
      ]);

      if (!monthlyStats.length || monthlyStats[0].monthlyGamesPlayed === 0) {
        return null;
      }

      const playerMonthlyScore = monthlyStats[0].monthlyScore;

      const playersWithHigherMonthlyScore = await Player.aggregate([
        {
          $lookup: {
            from: 'games',
            let: { playerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $gte: ['$startedAt', oneMonthAgo] },
                      { $in: ['$$playerId', '$players.playerId'] }
                    ]
                  }
                }
              },
              {
                $unwind: '$players'
              },
              {
                $match: {
                  'players.playerId': '$$playerId'
                }
              }
            ],
            as: 'monthlyGames'
          }
        },
        {
          $addFields: {
            monthlyScore: { $sum: '$monthlyGames.players.score' },
            monthlyGamesPlayed: { $size: '$monthlyGames' }
          }
        },
        {
          $match: {
            monthlyGamesPlayed: { $gte: 1 },
            monthlyScore: { $gt: playerMonthlyScore }
          }
        },
        {
          $count: 'count'
        }
      ]);

      const totalMonthlyPlayers = await Player.aggregate([
        {
          $lookup: {
            from: 'games',
            let: { playerId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $gte: ['$startedAt', oneMonthAgo] },
                      { $in: ['$$playerId', '$players.playerId'] }
                    ]
                  }
                }
              },
              {
                $unwind: '$players'
              },
              {
                $match: {
                  'players.playerId': '$$playerId'
                }
              }
            ],
            as: 'monthlyGames'
          }
        },
        {
          $addFields: {
            monthlyGamesPlayed: { $size: '$monthlyGames' }
          }
        },
        {
          $match: {
            monthlyGamesPlayed: { $gte: 1 }
          }
        },
        {
          $count: 'count'
        }
      ]);

      const higherScoreCount = playersWithHigherMonthlyScore[0]?.count || 0;
      const totalPlayers = totalMonthlyPlayers[0]?.count || 1;

      return {
        rank: higherScoreCount + 1,
        totalPlayers,
        percentile: Math.round(((totalPlayers - higherScoreCount) / totalPlayers) * 100),
        score: playerMonthlyScore,
        gamesPlayed: monthlyStats[0].monthlyGamesPlayed
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get leaderboard statistics
   * @returns {Object} Leaderboard statistics
   */
  async getLeaderboardStats() {
    try {
      const totalPlayers = await Player.countDocuments({ totalGamesPlayed: { $gte: 1 } });
      const totalGames = await Game.countDocuments();
      const activePlayers = await Player.countDocuments({ 
        lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      });

      const topPlayer = await Player.findOne({ totalGamesPlayed: { $gte: 1 } })
        .sort({ totalScore: -1 })
        .select('name totalScore totalGamesPlayed winRate');

      const averageScore = await Player.aggregate([
        { $match: { totalGamesPlayed: { $gte: 1 } } },
        { $group: { _id: null, avgScore: { $avg: '$totalScore' } } }
      ]);

      return {
        success: true,
        stats: {
          totalPlayers,
          totalGames,
          activePlayers,
          topPlayer: topPlayer ? {
            name: topPlayer.name,
            totalScore: topPlayer.totalScore,
            totalGamesPlayed: topPlayer.totalGamesPlayed,
            winRate: topPlayer.winRate
          } : null,
          averageScore: Math.round(averageScore[0]?.avgScore || 0)
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
   * Clear leaderboard cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cached leaderboard or fetch new one
   * @param {string} key - Cache key
   * @param {Function} fetchFunction - Function to fetch data
   * @returns {Object} Cached or fresh data
   */
  async getCachedLeaderboard(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetchFunction();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }
}

module.exports = LeaderboardService;
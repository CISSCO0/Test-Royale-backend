/**
 * Player service to handle player management, ready status, and score updates
 */

const Player = require('../models/player');

class PlayerService {
  constructor(roomService) {
    this.roomService = roomService;
    this.players = new Map(); // Maps playerId to Player instance
    this.playerStats = new Map(); // Maps playerId to player statistics
  }

  /**
   * Create a new player
   * @param {string} playerId - Socket ID of the player
   * @param {Object} playerData - Player information
   * @returns {Object} Created player or error
   */
  createPlayer(playerId, playerData = {}) {
    try {
      // Check if player already exists
      if (this.players.has(playerId)) {
        return {
          success: false,
          error: 'Player already exists',
          player: this.players.get(playerId).getSummary()
        };
      }

      // Create new player
      const player = new Player(
        playerId,
        playerData.name || `Player_${playerId.slice(-4)}`
      );

      // Set additional properties from playerData
      if (playerData.isHost) {
        player.isHost = true;
      }

      // Store player
      this.players.set(playerId, player);

      // Initialize player statistics
      this.playerStats.set(playerId, {
        totalGamesPlayed: 0,
        totalScore: 0,
        highestScore: 0,
        averageScore: 0,
        gamesWon: 0,
        lastPlayed: new Date(),
        readyCount: 0,
        totalPlayTime: 0
      });

      return {
        success: true,
        player: player.getSummary()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get player information
   * @param {string} playerId - Socket ID of the player
   * @returns {Object} Player data or error
   */
  getPlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) {
      return {
        success: false,
        error: 'Player not found'
      };
    }

    return {
      success: true,
      player: player.getSummary(),
      stats: this.playerStats.get(playerId)
    };
  }

  /**
   * Update player ready status
   * @param {string} playerId - Socket ID of the player
   * @param {boolean} isReady - Ready status
   * @returns {Object} Update result
   */
  setPlayerReady(playerId, isReady) {
    try {
      const player = this.players.get(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      // Update player ready status
      player.setReady(isReady);

      // Update statistics
      const stats = this.playerStats.get(playerId);
      if (stats) {
        if (isReady) {
          stats.readyCount++;
        }
        stats.lastPlayed = new Date();
      }

      // Also update in room if player is in one
      const roomResult = this.roomService.setPlayerReady(playerId, isReady);
      
      return {
        success: true,
        player: player.getSummary(),
        room: roomResult.success ? roomResult.room : null,
        allReady: roomResult.success ? roomResult.allReady : false
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update player score
   * @param {string} playerId - Socket ID of the player
   * @param {number} score - New score
   * @returns {Object} Update result
   */
  updatePlayerScore(playerId, score) {
    try {
      const player = this.players.get(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      // Validate score
      if (typeof score !== 'number' || score < 0) {
        return {
          success: false,
          error: 'Invalid score value'
        };
      }

      const oldScore = player.score;
      player.score = score;

      // Update statistics
      const stats = this.playerStats.get(playerId);
      if (stats) {
        stats.totalScore = stats.totalScore - oldScore + score;
        stats.highestScore = Math.max(stats.highestScore, score);
        stats.averageScore = stats.totalGamesPlayed > 0 ? 
          Math.round(stats.totalScore / stats.totalGamesPlayed) : 0;
        stats.lastPlayed = new Date();
      }

      // Also update in room if player is in one
      const roomResult = this.roomService.getPlayerRoom(playerId);
      if (roomResult.success) {
        const room = this.roomService.rooms.get(roomResult.room.code);
        if (room) {
          const roomPlayer = room.getPlayer(playerId);
          if (roomPlayer) {
            roomPlayer.score = score;
            room.updatedAt = new Date();
          }
        }
      }

      return {
        success: true,
        player: player.getSummary(),
        scoreChange: score - oldScore,
        room: roomResult.success ? roomResult.room : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add points to player score
   * @param {string} playerId - Socket ID of the player
   * @param {number} points - Points to add
   * @returns {Object} Update result
   */
  addPlayerScore(playerId, points) {
    try {
      const player = this.players.get(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      const newScore = player.score + points;
      return this.updatePlayerScore(playerId, newScore);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update player name
   * @param {string} playerId - Socket ID of the player
   * @param {string} newName - New player name
   * @returns {Object} Update result
   */
  updatePlayerName(playerId, newName) {
    try {
      const player = this.players.get(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
        return {
          success: false,
          error: 'Invalid player name'
        };
      }

      const oldName = player.name;
      player.updateName(newName.trim());

      // Also update in room if player is in one
      const roomResult = this.roomService.getPlayerRoom(playerId);
      if (roomResult.success) {
        const room = this.roomService.rooms.get(roomResult.room.code);
        if (room) {
          const roomPlayer = room.getPlayer(playerId);
          if (roomPlayer) {
            roomPlayer.name = newName.trim();
            room.updatedAt = new Date();
          }
        }
      }

      return {
        success: true,
        player: player.getSummary(),
        oldName,
        newName: newName.trim(),
        room: roomResult.success ? roomResult.room : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reset player score
   * @param {string} playerId - Socket ID of the player
   * @returns {Object} Reset result
   */
  resetPlayerScore(playerId) {
    try {
      const player = this.players.get(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      const oldScore = player.score;
      player.resetScore();

      // Also reset in room if player is in one
      const roomResult = this.roomService.getPlayerRoom(playerId);
      if (roomResult.success) {
        const room = this.roomService.rooms.get(roomResult.room.code);
        if (room) {
          const roomPlayer = room.getPlayer(playerId);
          if (roomPlayer) {
            roomPlayer.score = 0;
            room.updatedAt = new Date();
          }
        }
      }

      return {
        success: true,
        player: player.getSummary(),
        resetAmount: oldScore,
        room: roomResult.success ? roomResult.room : null
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
   * @param {string} playerId - Socket ID of the player
   * @returns {Object} Player summary or error
   */
  getPlayerSummary(playerId) {
    try {
      const player = this.players.get(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      const stats = this.playerStats.get(playerId);
      const roomResult = this.roomService.getPlayerRoom(playerId);

      return {
        success: true,
        player: player.getSummary(),
        stats: stats || {},
        currentRoom: roomResult.success ? roomResult.room : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all players
   * @returns {Array} Array of player summaries
   */
  getAllPlayers() {
    const players = [];
    for (const [playerId, player] of this.players.entries()) {
      const stats = this.playerStats.get(playerId);
      players.push({
        ...player.getSummary(),
        stats: stats || {}
      });
    }
    return players;
  }

  /**
   * Remove player
   * @param {string} playerId - Socket ID of the player
   * @returns {Object} Removal result
   */
  removePlayer(playerId) {
    try {
      const player = this.players.get(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      // Remove from room first
      const roomResult = this.roomService.leaveRoom(playerId);

      // Remove player and stats
      this.players.delete(playerId);
      this.playerStats.delete(playerId);

      return {
        success: true,
        player: player.getSummary(),
        room: roomResult.success ? roomResult.room : null
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
   * @param {string} playerId - Socket ID of the player
   * @param {Object} gameResult - Game result data
   * @returns {Object} Update result
   */
  updatePlayerStats(playerId, gameResult) {
    try {
      const stats = this.playerStats.get(playerId);
      if (!stats) {
        return {
          success: false,
          error: 'Player statistics not found'
        };
      }

      // Update game statistics
      stats.totalGamesPlayed++;
      stats.lastPlayed = new Date();
      
      if (gameResult.finalScore) {
        stats.totalScore += gameResult.finalScore;
        stats.highestScore = Math.max(stats.highestScore, gameResult.finalScore);
        stats.averageScore = Math.round(stats.totalScore / stats.totalGamesPlayed);
      }

      if (gameResult.won) {
        stats.gamesWon++;
      }

      if (gameResult.playTime) {
        stats.totalPlayTime += gameResult.playTime;
      }

      return {
        success: true,
        stats
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
   * @returns {Array} Sorted leaderboard
   */
  getPlayerLeaderboard(limit = 10) {
    const players = this.getAllPlayers();
    
    return players
      .sort((a, b) => {
        // Sort by highest score first, then by average score
        if (b.stats.highestScore !== a.stats.highestScore) {
          return b.stats.highestScore - a.stats.highestScore;
        }
        return b.stats.averageScore - a.stats.averageScore;
      })
      .slice(0, limit)
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));
  }

  /**
   * Get player statistics
   * @returns {Object} Overall player statistics
   */
  getPlayerStats() {
    const players = this.getAllPlayers();
    const totalPlayers = players.length;
    
    if (totalPlayers === 0) {
      return {
        totalPlayers: 0,
        averageScore: 0,
        totalGamesPlayed: 0,
        mostActivePlayer: null
      };
    }

    const totalGamesPlayed = players.reduce((sum, player) => 
      sum + (player.stats.totalGamesPlayed || 0), 0);
    
    const averageScore = players.reduce((sum, player) => 
      sum + (player.stats.averageScore || 0), 0) / totalPlayers;

    const mostActivePlayer = players.reduce((most, player) => 
      (player.stats.totalGamesPlayed || 0) > (most.stats.totalGamesPlayed || 0) ? player : most);

    return {
      totalPlayers,
      averageScore: Math.round(averageScore),
      totalGamesPlayed,
      mostActivePlayer: mostActivePlayer ? {
        id: mostActivePlayer.id,
        name: mostActivePlayer.name,
        gamesPlayed: mostActivePlayer.stats.totalGamesPlayed || 0
      } : null
    };
  }

  /**
   * Clean up inactive players
   * @param {number} inactiveMinutes - Minutes of inactivity before cleanup
   * @returns {number} Number of players cleaned up
   */
  cleanupInactivePlayers(inactiveMinutes = 30) {
    const cutoffTime = new Date(Date.now() - inactiveMinutes * 60 * 1000);
    let cleaned = 0;

    for (const [playerId, player] of this.players.entries()) {
      if (player.lastActive < cutoffTime) {
        // Remove from room first
        this.roomService.leaveRoom(playerId);
        
        // Remove player and stats
        this.players.delete(playerId);
        this.playerStats.delete(playerId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

module.exports = PlayerService;
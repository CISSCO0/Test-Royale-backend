
class PlayerController {
  constructor(playerService, roomService) {
    this.playerService = playerService;
    this.roomService = roomService;
  }

  /**
   * Create a new player
   * @param {string} playerId - Socket ID of the player
   * @param {Object} playerData - Player information
   * @returns {Object} Created player or error
   */
  createPlayer(playerId, playerData = {}) {
    try {
      return this.playerService.createPlayer(playerId, playerData);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }



  /**
   * Join a room as a player
   * @param {string} playerId - Socket ID of the player
   * @param {string} roomCode - Room code to join
   * @param {Object} playerData - Player information
   * @returns {Object} Join result or error
   */
  joinRoom(playerId, roomCode, playerData = {}) {
    try {
      // First create or get the player
      let playerResult = this.playerService.getPlayer(playerId);
      if (!playerResult.success) {
        // Create player if doesn't exist
        playerResult = this.playerService.createPlayer(playerId, playerData);
        if (!playerResult.success) {
          return playerResult;
        }
      }

      // Join the room
      const roomResult = this.roomService.joinRoom(playerId, roomCode, playerData);
      if (!roomResult.success) {
        return roomResult;
      }

      return {
        success: true,
        player: playerResult.player,
        room: roomResult.room,
        roomCode
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Leave current room
   * @param {string} playerId - Socket ID of the player
   * @returns {Object} Leave result
   */
  leaveRoom(playerId) {
    try {
      return this.playerService.removePlayer(playerId);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set player ready status
   * @param {string} playerId - Socket ID of the player
   * @param {boolean} isReady - Ready status
   * @returns {Object} Update result
   */
  setPlayerReady(playerId, isReady) {
    try {
      return this.playerService.setPlayerReady(playerId, isReady);
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
      return this.playerService.updatePlayerScore(playerId, score);
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
      return this.playerService.addPlayerScore(playerId, points);
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
      return this.playerService.updatePlayerName(playerId, newName);
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
      return this.playerService.resetPlayerScore(playerId);
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
      return this.playerService.getPlayerSummary(playerId);
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
    try {
      return {
        success: true,
        players: this.playerService.getAllPlayers()
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
   * @returns {Object} Leaderboard data
   */
  getPlayerLeaderboard(limit = 10) {
    try {
      return {
        success: true,
        leaderboard: this.playerService.getPlayerLeaderboard(limit)
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
   * @returns {Object} Player statistics
   */
  getPlayerStats() {
    try {
      return {
        success: true,
        stats: this.playerService.getPlayerStats()
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
      return this.playerService.updatePlayerStats(playerId, gameResult);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get player's current room information
   * @param {string} playerId - Socket ID of the player
   * @returns {Object} Room information or error
   */
  getPlayerRoom(playerId) {
    try {
      const roomResult = this.roomService.getPlayerRoom(playerId);
      if (!roomResult.success) {
        return roomResult;
      }

      // Get player information from the room
      const room = this.roomService.rooms.get(roomResult.room.code);
      const player = room ? room.getPlayer(playerId) : null;

      return {
        success: true,
        room: roomResult.room,
        player: player ? player : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if player is ready
   * @param {string} playerId - Socket ID of the player
   * @returns {Object} Ready status or error
   */
  isPlayerReady(playerId) {
    try {
      const playerResult = this.playerService.getPlayer(playerId);
      if (!playerResult.success) {
        return playerResult;
      }

      return {
        success: true,
        isReady: playerResult.player.isReady,
        player: playerResult.player
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get player's score
   * @param {string} playerId - Socket ID of the player
   * @returns {Object} Player score or error
   */
  getPlayerScore(playerId) {
    try {
      const playerResult = this.playerService.getPlayer(playerId);
      if (!playerResult.success) {
        return playerResult;
      }

      return {
        success: true,
        score: playerResult.player.score,
        player: playerResult.player
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up inactive players
   * @param {number} inactiveMinutes - Minutes of inactivity before cleanup
   * @returns {Object} Cleanup result
   */
  cleanupInactivePlayers(inactiveMinutes = 30) {
    try {
      const cleaned = this.playerService.cleanupInactivePlayers(inactiveMinutes);
      return {
        success: true,
        cleanedPlayers: cleaned
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive player dashboard data
   * @param {string} playerId - Socket ID of the player
   * @returns {Object} Dashboard data or error
   */
  getPlayerDashboard(playerId) {
    try {
      const playerSummary = this.playerService.getPlayerSummary(playerId);
      if (!playerSummary.success) {
        return playerSummary;
      }

      const roomResult = this.roomService.getPlayerRoom(playerId);
      const leaderboard = this.playerService.getPlayerLeaderboard(5);
      const stats = this.playerService.getPlayerStats();

      return {
        success: true,
        player: playerSummary.player,
        playerStats: playerSummary.stats,
        currentRoom: roomResult.success ? roomResult.room : null,
        topPlayers: leaderboard,
        globalStats: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate player data
   * @param {Object} playerData - Player data to validate
   * @returns {Object} Validation result
   */
  validatePlayerData(playerData) {
    const errors = [];

    if (playerData.name && (typeof playerData.name !== 'string' || playerData.name.trim().length === 0)) {
      errors.push('Player name must be a non-empty string');
    }

    if (playerData.score !== undefined && (typeof playerData.score !== 'number' || playerData.score < 0)) {
      errors.push('Player score must be a non-negative number');
    }

    if (playerData.isReady !== undefined && typeof playerData.isReady !== 'boolean') {
      errors.push('Player ready status must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = PlayerController;
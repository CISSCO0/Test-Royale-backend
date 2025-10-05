/**
 * Game controller to handle game logic and state management
 */

class GameController {
  constructor(roomService) {
    this.roomService = roomService;
  }

  /**
   * Start a game in a room
   * @param {string} roomCode - Room code
   * @param {string} playerId - Player ID of the host
   * @returns {Object} Start game result
   */
  startGame(roomCode, playerId) {
    try {
      const roomResult = this.roomService.getRoom(roomCode);
      if (!roomResult.success) {
        return roomResult;
      }

      const room = this.roomService.rooms.get(roomCode);
      
      // Check if player is the host
      if (room.hostId !== playerId) {
        return {
          success: false,
          error: 'Only the host can start the game'
        };
      }

      // Check if room has enough players
      if (room.players.size < 2) {
        return {
          success: false,
          error: 'Need at least 2 players to start the game'
        };
      }

      // Check if all players are ready
      if (!room.allPlayersReady()) {
        return {
          success: false,
          error: 'All players must be ready to start the game'
        };
      }

      // Start the game
      room.setGameState('playing');
      room.updateGameData({
        startTime: new Date(),
        round: 1,
        currentPlayer: room.hostId,
        gameEvents: []
      });

      return {
        success: true,
        room: room.getSummary(),
        gameData: room.gameData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * End a game in a room
   * @param {string} roomCode - Room code
   * @param {string} playerId - Player ID
   * @returns {Object} End game result
   */
  endGame(roomCode, playerId) {
    try {
      const roomResult = this.roomService.getRoom(roomCode);
      if (!roomResult.success) {
        return roomResult;
      }

      const room = this.roomService.rooms.get(roomCode);
      
      // Check if player is the host
      if (room.hostId !== playerId) {
        return {
          success: false,
          error: 'Only the host can end the game'
        };
      }

      // End the game
      room.setGameState('finished');
      room.updateGameData({
        endTime: new Date(),
        finalScores: this.calculateFinalScores(room)
      });

      return {
        success: true,
        room: room.getSummary(),
        finalScores: room.gameData.finalScores
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
   * @param {string} roomCode - Room code
   * @param {string} playerId - Player ID
   * @param {number} score - New score
   * @returns {Object} Update result
   */
  updatePlayerScore(roomCode, playerId, score) {
    try {
      const roomResult = this.roomService.getRoom(roomCode);
      if (!roomResult.success) {
        return roomResult;
      }

      const room = this.roomService.rooms.get(roomCode);
      const player = room.getPlayer(playerId);
      
      if (!player) {
        return {
          success: false,
          error: 'Player not found in room'
        };
      }

      // Update player score
      player.score = Math.max(0, score); // Ensure score is not negative
      room.updatedAt = new Date();

      // Add game event
      const gameEvents = room.gameData.gameEvents || [];
      gameEvents.push({
        type: 'score_update',
        playerId,
        playerName: player.name,
        newScore: player.score,
        timestamp: new Date()
      });
      room.updateGameData({ gameEvents });

      return {
        success: true,
        room: room.getSummary(),
        playerScore: player.score
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
   * @param {string} roomCode - Room code
   * @param {string} playerId - Player ID
   * @param {number} points - Points to add
   * @returns {Object} Update result
   */
  addPlayerScore(roomCode, playerId, points) {
    try {
      const roomResult = this.roomService.getRoom(roomCode);
      if (!roomResult.success) {
        return roomResult;
      }

      const room = this.roomService.rooms.get(roomCode);
      const player = room.getPlayer(playerId);
      
      if (!player) {
        return {
          success: false,
          error: 'Player not found in room'
        };
      }

      const newScore = player.score + points;
      return this.updatePlayerScore(roomCode, playerId, newScore);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get game leaderboard
   * @param {string} roomCode - Room code
   * @returns {Object} Leaderboard data
   */
  getLeaderboard(roomCode) {
    try {
      const roomResult = this.roomService.getRoom(roomCode);
      if (!roomResult.success) {
        return roomResult;
      }

      const room = this.roomService.rooms.get(roomCode);
      const players = room.getAllPlayers();
      
      // Sort players by score (descending)
      const leaderboard = players
        .map(player => ({
          id: player.id,
          name: player.name,
          score: player.score,
          isReady: player.isReady
        }))
        .sort((a, b) => b.score - a.score);

      return {
        success: true,
        leaderboard,
        roomCode,
        gameState: room.gameState
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate final scores for the game
   * @param {Room} room - Room instance
   * @returns {Array} Final scores array
   */
  calculateFinalScores(room) {
    const players = room.getAllPlayers();
    return players
      .map(player => ({
        id: player.id,
        name: player.name,
        finalScore: player.score,
        position: 0 // Will be set after sorting
      }))
      .sort((a, b) => b.finalScore - a.finalScore)
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));
  }

  /**
   * Reset game state
   * @param {string} roomCode - Room code
   * @param {string} playerId - Player ID of the host
   * @returns {Object} Reset result
   */
  resetGame(roomCode, playerId) {
    try {
      const roomResult = this.roomService.getRoom(roomCode);
      if (!roomResult.success) {
        return roomResult;
      }

      const room = this.roomService.rooms.get(roomCode);
      
      // Check if player is the host
      if (room.hostId !== playerId) {
        return {
          success: false,
          error: 'Only the host can reset the game'
        };
      }

      // Reset game state
      room.setGameState('waiting');
      room.updateGameData({});
      
      // Reset all player scores and ready status
      for (const player of room.players.values()) {
        player.score = 0;
        player.isReady = false;
      }

      return {
        success: true,
        room: room.getSummary()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get game statistics
   * @param {string} roomCode - Room code
   * @returns {Object} Game statistics
   */
  getGameStats(roomCode) {
    try {
      const roomResult = this.roomService.getRoom(roomCode);
      if (!roomResult.success) {
        return roomResult;
      }

      const room = this.roomService.rooms.get(roomCode);
      const players = room.getAllPlayers();
      
      const stats = {
        roomCode,
        gameState: room.gameState,
        playerCount: players.length,
        totalScore: players.reduce((sum, player) => sum + player.score, 0),
        averageScore: players.length > 0 ? 
          Math.round(players.reduce((sum, player) => sum + player.score, 0) / players.length) : 0,
        highestScore: Math.max(...players.map(p => p.score)),
        gameDuration: room.gameData.startTime ? 
          new Date() - new Date(room.gameData.startTime) : 0,
        events: room.gameData.gameEvents || []
      };

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
}

module.exports = GameController;
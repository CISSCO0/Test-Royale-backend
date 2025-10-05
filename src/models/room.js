/**
 * Room model to define the structure and behavior of game rooms
 */

class Room {
  constructor(code, hostId, maxPlayers = 4) {
    this.code = code;
    this.hostId = hostId;
    this.maxPlayers = maxPlayers;
    this.players = new Map();
    this.gameState = 'waiting'; // waiting, playing, finished
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.gameData = {};
  }

  /**
   * Add a player to the room
   * @param {string} playerId - Socket ID of the player
   * @param {Object} playerData - Player information
   * @returns {boolean} True if player was added successfully
   */
  addPlayer(playerId, playerData) {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }

    if (this.players.has(playerId)) {
      return false;
    }

    this.players.set(playerId, {
      id: playerId,
      name: playerData.name || `Player ${this.players.size + 1}`,
      score: 0,
      isReady: false,
      joinedAt: new Date(),
      ...playerData
    });

    this.updatedAt = new Date();
    return true;
  }

  /**
   * Remove a player from the room
   * @param {string} playerId - Socket ID of the player
   * @returns {boolean} True if player was removed successfully
   */
  removePlayer(playerId) {
    const removed = this.players.delete(playerId);
    this.updatedAt = new Date();
    return removed;
  }

  /**
   * Get player information
   * @param {string} playerId - Socket ID of the player
   * @returns {Object|null} Player data or null if not found
   */
  getPlayer(playerId) {
    return this.players.get(playerId) || null;
  }

  /**
   * Get all players in the room
   * @returns {Array} Array of player objects
   */
  getAllPlayers() {
    return Array.from(this.players.values());
  }

  /**
   * Check if room is full
   * @returns {boolean} True if room is at capacity
   */
  isFull() {
    return this.players.size >= this.maxPlayers;
  }

  /**
   * Check if room is empty
   * @returns {boolean} True if no players in room
   */
  isEmpty() {
    return this.players.size === 0;
  }

  /**
   * Update player ready status
   * @param {string} playerId - Socket ID of the player
   * @param {boolean} isReady - Ready status
   * @returns {boolean} True if updated successfully
   */
  setPlayerReady(playerId, isReady) {
    const player = this.players.get(playerId);
    if (player) {
      player.isReady = isReady;
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Check if all players are ready
   * @returns {boolean} True if all players are ready
   */
  allPlayersReady() {
    if (this.players.size === 0) return false;
    
    for (const player of this.players.values()) {
      if (!player.isReady) {
        return false;
      }
    }
    return true;
  }

  /**
   * Update game state
   * @param {string} state - New game state
   */
  setGameState(state) {
    this.gameState = state;
    this.updatedAt = new Date();
  }

  /**
   * Update game data
   * @param {Object} data - Game data to update
   */
  updateGameData(data) {
    this.gameData = { ...this.gameData, ...data };
    this.updatedAt = new Date();
  }

  /**
   * Get room summary for client
   * @returns {Object} Room summary
   */
  getSummary() {
    return {
      code: this.code,
      hostId: this.hostId,
      maxPlayers: this.maxPlayers,
      currentPlayers: this.players.size,
      gameState: this.gameState,
      players: this.getAllPlayers(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Clean up room data
   */
  cleanup() {
    this.players.clear();
    this.gameData = {};
    this.gameState = 'waiting';
  }
}

module.exports = Room;
/**
 * Player model to define structure and behavior of players
 */
class Player {
  constructor(id, name = "Unknown Player", options = {}) {
    this.id = id; // Socket ID
    this.name = name;
    this.score = 0;
    this.isReady = false;
    this.isHost = false;
    this.joinedAt = new Date();
    this.lastActive = new Date();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    // Additional properties from options
    if (options.isHost) {
      this.isHost = true;
    }
    if (options.score !== undefined) {
      this.score = Math.max(0, options.score);
    }
    if (options.isReady !== undefined) {
      this.isReady = options.isReady;
    }
  }

  /**
   * Set player ready status
   * @param {boolean} status - Ready status
   */
  setReady(status) {
    this.isReady = status;
    this.lastActive = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Add points to player score
   * @param {number} points - Points to add
   */
  addScore(points) {
    if (typeof points === 'number' && points > 0) {
      this.score += points;
      this.lastActive = new Date();
      this.updatedAt = new Date();
    }
  }

  /**
   * Set player score to specific value
   * @param {number} score - New score value
   */
  setScore(score) {
    if (typeof score === 'number' && score >= 0) {
      this.score = score;
      this.lastActive = new Date();
      this.updatedAt = new Date();
    }
  }

  /**
   * Reset player score to zero
   */
  resetScore() {
    this.score = 0;
    this.lastActive = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Update player name
   * @param {string} newName - New player name
   */
  updateName(newName) {
    if (newName && typeof newName === "string" && newName.trim().length > 0) {
      this.name = newName.trim();
      this.lastActive = new Date();
      this.updatedAt = new Date();
    }
  }

  /**
   * Set player as host
   * @param {boolean} isHost - Host status
   */
  setHost(isHost) {
    this.isHost = isHost;
    this.updatedAt = new Date();
  }

  /**
   * Update last active timestamp
   */
  updateLastActive() {
    this.lastActive = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Check if player is active (within last 5 minutes)
   * @param {number} inactiveMinutes - Minutes of inactivity threshold
   * @returns {boolean} True if player is active
   */
  isActive(inactiveMinutes = 5) {
    const cutoffTime = new Date(Date.now() - inactiveMinutes * 60 * 1000);
    return this.lastActive > cutoffTime;
  }

  /**
   * Get player summary for client
   * @returns {Object} Player summary
   */
  getSummary() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isReady: this.isReady,
      isHost: this.isHost,
      joinedAt: this.joinedAt,
      lastActive: this.lastActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Get player data for room display
   * @returns {Object} Player data for room
   */
  getRoomData() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isReady: this.isReady,
      isHost: this.isHost,
      joinedAt: this.joinedAt
    };
  }

  /**
   * Clone player data
   * @returns {Object} Cloned player data
   */
  clone() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isReady: this.isReady,
      isHost: this.isHost,
      joinedAt: new Date(this.joinedAt),
      lastActive: new Date(this.lastActive),
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt)
    };
  }

  /**
   * Update player from data object
   * @param {Object} data - Data to update
   */
  updateFromData(data) {
    if (data.name !== undefined) {
      this.updateName(data.name);
    }
    if (data.score !== undefined) {
      this.setScore(data.score);
    }
    if (data.isReady !== undefined) {
      this.setReady(data.isReady);
    }
    if (data.isHost !== undefined) {
      this.setHost(data.isHost);
    }
  }

  /**
   * Clean up player data
   */
  cleanup() {
    this.score = 0;
    this.isReady = false;
    this.isHost = false;
    this.updatedAt = new Date();
  }
}

module.exports = Player;

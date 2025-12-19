const Player = require('../models/player');
const Game = require('../models/game');

class LeaderboardService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
}

module.exports = LeaderboardService;
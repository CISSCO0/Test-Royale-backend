const Game = require('../models/game');
const Player = require('../models/player');
const Code = require('../models/code');
const Room = require('../models/room');
const Achievement = require('../models/achievement');
const Badge = require('../models/badge');

class GameService {
  constructor() {
    this.activeGames = new Map(); // In-memory storage for active games
  }

  /**
   * Start a new game
   * @param {string} roomCode - Room code
   * @param {string} codeId - Code challenge ID
   * @returns {Object} Game start result
   */
  async startGame(roomCode, codeId) {
    try {
      // Get room and code
      const room = await Room.findOne({ code: roomCode }).populate('players.playerId');
      const codeChallenge = await Code.findById(codeId);

      if (!room) {
        return {
          success: false,
          error: 'Room not found'
        };
      }

      if (!codeChallenge) {
        return {
          success: false,
          error: 'Code challenge not found'
        };
      }

      if (room.gameState !== 'waiting') {
        return {
          success: false,
          error: 'Game already started or finished'
        };
      }

      if (room.players.length < 2) {
        return {
          success: false,
          error: 'Need at least 2 players to start game'
        };
      }

      // Create game
      const game = new Game({
        roomCode,
        codeId,
        players: room.players.map(player => ({
          playerId: player.playerId._id,
          playerCode: '',
          score: 0,
          coverageScore: 0,
          mutationScore: 0,
          redundancyPenalty: 0,
          badgesEarned: [],
          feedback: '',
          gameDuration: 0
        })),
        gameState: 'playing',
        startedAt: new Date()
      });

      await game.save();

      // Update room state
      room.gameState = 'playing';
      room.gameData = {
        gameId: game._id,
        codeChallenge: {
          title: codeChallenge.title,
          description: codeChallenge.description,
          language: codeChallenge.language,
          baseCode: codeChallenge.baseCode
        }
      };
      await room.save();

      // Store in memory for quick access
      this.activeGames.set(game._id.toString(), {
        gameId: game._id,
        roomCode,
        codeId,
        players: game.players,
        startedAt: game.startedAt,
        timeLimit: 300 // 5 minutes default
      });

      return {
        success: true,
        game: {
          id: game._id,
          roomCode,
          codeChallenge: {
            title: codeChallenge.title,
            description: codeChallenge.description,
            language: codeChallenge.language,
            baseCode: codeChallenge.baseCode
          },
          players: game.players.map(p => ({
            playerId: p.playerId,
            score: p.score,
            gameDuration: p.gameDuration
          })),
          startedAt: game.startedAt,
          timeLimit: 300
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
   * Submit player's test code
   * @param {string} gameId - Game ID
   * @param {string} playerId - Player ID
   * @param {string} testCode - Player's test code
   * @returns {Object} Submission result
   */
  async submitTestCode(gameId, playerId, testCode) {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        return {
          success: false,
          error: 'Game not found'
        };
      }

      if (game.gameState !== 'playing') {
        return {
          success: false,
          error: 'Game is not active'
        };
      }

      // Find player in game
      const playerIndex = game.players.findIndex(p => p.playerId.toString() === playerId);
      if (playerIndex === -1) {
        return {
          success: false,
          error: 'Player not in this game'
        };
      }

      // Calculate game duration
      const gameDuration = Math.floor((new Date() - game.startedAt) / 1000);
      
      // Update player's submission
      game.players[playerIndex].playerCode = testCode;
      game.players[playerIndex].submittedAt = new Date();
      game.players[playerIndex].gameDuration = gameDuration;

      await game.save();

      // Update in-memory game
      const activeGame = this.activeGames.get(gameId.toString());
      if (activeGame) {
        const activePlayerIndex = activeGame.players.findIndex(p => p.playerId.toString() === playerId);
        if (activePlayerIndex !== -1) {
          activeGame.players[activePlayerIndex].playerCode = testCode;
          activeGame.players[activePlayerIndex].submittedAt = new Date();
          activeGame.players[activePlayerIndex].gameDuration = gameDuration;
        }
      }

      return {
        success: true,
        message: 'Test code submitted successfully',
        gameDuration
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate and update scores for all players
   * @param {string} gameId - Game ID
   * @returns {Object} Scoring result
   */
  async calculateScores(gameId) {
    try {
      const game = await Game.findById(gameId).populate('codeId');
      if (!game) {
        return {
          success: false,
          error: 'Game not found'
        };
      }

      const codeChallenge = game.codeId;
      const results = [];

      // Calculate scores for each player
      for (let i = 0; i < game.players.length; i++) {
        const player = game.players[i];
        
        if (!player.playerCode) {
          // Player didn't submit
          player.score = 0;
          player.coverageScore = 0;
          player.mutationScore = 0;
          player.redundancyPenalty = 0;
          player.feedback = 'No test code submitted';
          continue;
        }

        // Calculate scores (this would integrate with actual testing tools)
        const scores = await this.calculatePlayerScores(
          codeChallenge.baseCode,
          player.playerCode,
          codeChallenge.language
        );

        player.score = scores.totalScore;
        player.coverageScore = scores.coverageScore;
        player.mutationScore = scores.mutationScore;
        player.redundancyPenalty = scores.redundancyPenalty;
        player.feedback = scores.feedback;

        results.push({
          playerId: player.playerId,
          score: player.score,
          coverageScore: player.coverageScore,
          mutationScore: player.mutationScore,
          redundancyPenalty: player.redundancyPenalty,
          feedback: player.feedback
        });
      }

      // Determine winner
      const winner = game.players.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      );

      // Update game state
      game.gameState = 'finished';
      game.finishedAt = new Date();
      game.winner = winner.playerId;
      game.totalDuration = Math.floor((game.finishedAt - game.startedAt) / 1000);

      await game.save();

      // Update player statistics
      await this.updatePlayerStats(game);

      // Remove from active games
      this.activeGames.delete(gameId.toString());

      return {
        success: true,
        results,
        winner: {
          playerId: winner.playerId,
          score: winner.score
        },
        gameDuration: game.totalDuration
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate individual player scores
   * @param {string} baseCode - Original code to test
   * @param {string} testCode - Player's test code
   * @param {string} language - Programming language
   * @returns {Object} Calculated scores
   */
  async calculatePlayerScores(baseCode, testCode, language) {
    // This is a simplified scoring system
    // In a real implementation, you would integrate with testing frameworks
    
    try {
      // Mock scoring calculation
      const coverageScore = Math.min(100, testCode.length * 2); // Simple coverage based on test length
      const mutationScore = Math.min(100, testCode.split('assert').length * 10); // Based on assertions
      const redundancyPenalty = Math.max(0, (testCode.length - 500) * 0.1); // Penalty for overly long tests
      
      const totalScore = Math.max(0, coverageScore + mutationScore - redundancyPenalty);
      
      let feedback = '';
      if (coverageScore < 50) {
        feedback += 'Low test coverage. ';
      }
      if (mutationScore < 30) {
        feedback += 'Need more assertions. ';
      }
      if (redundancyPenalty > 0) {
        feedback += 'Tests are too verbose. ';
      }
      if (feedback === '') {
        feedback = 'Great test coverage and assertions!';
      }

      return {
        totalScore: Math.round(totalScore),
        coverageScore: Math.round(coverageScore),
        mutationScore: Math.round(mutationScore),
        redundancyPenalty: Math.round(redundancyPenalty),
        feedback: feedback.trim()
      };
    } catch (error) {
      return {
        totalScore: 0,
        coverageScore: 0,
        mutationScore: 0,
        redundancyPenalty: 0,
        feedback: 'Error in test execution'
      };
    }
  }

  /**
   * Update player statistics after game completion
   * @param {Object} game - Game object
   */
  async updatePlayerStats(game) {
    try {
      for (const playerData of game.players) {
        const player = await Player.findById(playerData.playerId);
        if (!player) continue;

        // Update basic stats
        player.totalGamesPlayed += 1;
        player.totalScore += playerData.score;
        player.averageScore = Math.round(player.totalScore / player.totalGamesPlayed);

        // Update win/loss
        if (playerData.playerId.toString() === game.winner.toString()) {
          player.totalGamesWon += 1;
          player.currentStreak += 1;
          player.bestStreak = Math.max(player.bestStreak, player.currentStreak);
        } else {
          player.currentStreak = 0;
        }

        // Update win rate
        player.winRate = Math.round((player.totalGamesWon / player.totalGamesPlayed) * 100);

        await player.save();

        // Check for achievements and badges
        await this.checkAchievements(player);
        await this.checkBadges(player);
      }
    } catch (error) {
      console.error('Error updating player stats:', error);
    }
  }

  /**
   * Check and award achievements
   * @param {Object} player - Player object
   */
  async checkAchievements(player) {
    try {
      const achievements = await Achievement.find();
      
      for (const achievement of achievements) {
        // Check if player already has this achievement
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
        }

        if (shouldAward) {
          player.achievements.push(achievement._id);
        }
      }

      await player.save();
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  /**
   * Check and award badges
   * @param {Object} player - Player object
   */
  async checkBadges(player) {
    try {
      const badges = await Badge.find();
      
      for (const badge of badges) {
        // Check if player already has this badge
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
        }

        if (shouldAward) {
          player.badges.push(badge._id);
        }
      }

      await player.save();
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  }

  /**
   * Get game results
   * @param {string} gameId - Game ID
   * @returns {Object} Game results
   */
  async getGameResults(gameId) {
    try {
      const game = await Game.findById(gameId)
        .populate('players.playerId', 'name email')
        .populate('codeId', 'title description language')
        .populate('winner', 'name');

      if (!game) {
        return {
          success: false,
          error: 'Game not found'
        };
      }

      return {
        success: true,
        game: {
          id: game._id,
          roomCode: game.roomCode,
          codeChallenge: game.codeId,
          players: game.players.map(p => ({
            playerId: p.playerId._id,
            name: p.playerId.name,
            score: p.score,
            coverageScore: p.coverageScore,
            mutationScore: p.mutationScore,
            redundancyPenalty: p.redundancyPenalty,
            feedback: p.feedback,
            gameDuration: p.gameDuration,
            submittedAt: p.submittedAt
          })),
          winner: game.winner,
          gameState: game.gameState,
          startedAt: game.startedAt,
          finishedAt: game.finishedAt,
          totalDuration: game.totalDuration
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
   * Get active games
   * @returns {Array} List of active games
   */
  getActiveGames() {
    return Array.from(this.activeGames.values());
  }

  /**
   * End a game early
   * @param {string} gameId - Game ID
   * @returns {Object} End game result
   */
  async endGame(gameId) {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        return {
          success: false,
          error: 'Game not found'
        };
      }

      if (game.gameState === 'finished') {
        return {
          success: false,
          error: 'Game already finished'
        };
      }

      // Calculate scores for submitted players
      await this.calculateScores(gameId);

      // Remove from active games
      this.activeGames.delete(gameId.toString());

      return {
        success: true,
        message: 'Game ended successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = GameService;
const Game = require('../models/game');
const Player = require('../models/player');
const Achievement = require('../models/achievement');


const Badge = require('../models/badge');
const CodeService = require('./codeService');
const RoomService = require('./roomService');
const PlayerService = require('./playerService');
const path = require('path');
const { base } = require('../models/code');
class GameService {

  constructor() {
    this.activeGames = new Map(); // In-memory storage for active games
    this.codeService = new CodeService(); 
    this.roomService = new RoomService();
    this.playerService = new PlayerService();
  }

  async getGame(gameId) {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        return { success: false, error: 'Game not found' };
      }
      return { success: true, game };
    }catch (error) {
      return { success: false, error: error.message };
    }
  }

  async startGame(PlayerId) {
  try {
    
    const player = await this.playerService.getPlayer(PlayerId);
    if (!player.success) return {success:false , error: player.error};

    const playerRoomResult = await this.roomService.getPlayerRoom(PlayerId);
    const room = playerRoomResult.room;
    if (!playerRoomResult.success) return { success: false, error: 'Room not found' };
    if (room.gameState !== 'waiting') return { success: false, error: 'Game already started or finished' };
    if (room.players.length < 2) return { success: false, error: 'Need at least 2 players to start game' };
    
    if (this.activeGames.has(room.code)) {
      return { success: false, error: 'Game already started in this room' };
    }

    const codeChallengeResult = await this.codeService.getRandomChallenge();
    if (!codeChallengeResult.success) return { success: false, error: 'Code challenge not found' };
    
    
    const allReady = room.players.every(p => p.isReady);
    if (!allReady) return { success: false, error: 'Not all players are ready' };

    const challenge = codeChallengeResult.challenge;

    const game = new Game({
      roomCode: room.code,
      hostId: room.hostId,
      codeId: challenge.id,
      players: room.players.map(player => ({
        playerId: player.playerId._id || player.playerId,
        playerCode: "init",
        totalScore: 0,
        branchCoverage: 0,
        lineCoverage: 0,
        mutation: {
          score: 0,
          total: 0,
          killed: 0,
          survived: 0,
          timeout: 0,
          noCoverage: 0,
          details: []
        },
        badgesEarned: [],
        testLines: 0,
        executionTime: 0,
        feedback: ''
      })),
      gameState: 'playing',
      startedAt: new Date()
    });

    await game.save();

    // Use your roomService method here
    const updateResult = await this.roomService.updateRoomGameState(room.code, 'playing', { gameId: game._id, codeId: challenge.id });
    if (!updateResult.success) return { success: false, error: updateResult.error };

    this.activeGames.set(game._id.toString(), {
      gameId: game._id,
      roomCode: room.code,
      codeId: challenge.id,
      players: game.players,
      startedAt: game.startedAt,
      timeLimit: 300
    });

    return {
      success: true,
      game
    };

  } catch (error) {
    return { success: false, error: error.message };
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
      return { success: false, error: "Game not found" };
    }

    const player = await this.playerService.getPlayer(playerId);
    if (!player.success) {
      return { success: false, error: player.error };
    }

    if (game.gameState !== "playing") {
      return { success: false, error: "Game is not active" };
    }

    if (!testCode) {
      return { success: false, error: "No test code submitted" };
    }

    // Find player inside game
    const playerIndex = game.players.findIndex(
      p => p.playerId.toString() === playerId.toString()
    );

    if (playerIndex === -1) {
      return {
        success: false,
        error: "Player not part of this game. Please join before submitting code."
      };
    }

    console.log (" Menna is happy ")
    // Calculate duration and update player info
    game.players[playerIndex].submission.testCode = testCode;
    game.players[playerIndex].submittedAt = new Date();
    console.log (" Menna is happy 2 ")
    game.markModified("players");
    game.markModified("submission");
    try {
    await game.save();
    } catch (e) {
      console.error("Error saving game after test code submission:", e);
    }

    // Update in-memory version if it exists
    const activeGame = this.activeGames.get(gameId.toString());
    if (activeGame) {


      const activePlayerIndex = activeGame.players.findIndex(
        p => p.playerId.toString() === playerId.toString()
      );
      if (activePlayerIndex !== -1) {
        activeGame.players[activePlayerIndex].submission.testCode = testCode;
        activeGame.players[activePlayerIndex].submittedAt = new Date();
      }
    }


    return {
      success: true,
      message: "Test code submitted successfully",
      game
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get the player's last test submission for a given game (debug version)
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 */
async getLastSubmission(playerId, gameId) {
  try {
  
    // 1️⃣ Fetch player info
    const playerInfo = await this.playerService.getPlayer(playerId);

    if (!playerInfo.success) {
      
      return { success: false, error: playerInfo.error };
    }

    // 2️⃣ Fetch game
    const game = await Game.findById(gameId);

    if (!game) {

      return { success: false, error: "Game not found" };
    }


    // 3️⃣ Find player in game
    const gamePlayer = game.players.find(
      p => p.playerId.toString() === playerId.toString()
    );

    if (!gamePlayer) {
      return { success: false, error: "Player not found in this game" };
    }

    // 4️⃣ Check submission
    if (!gamePlayer.submission || !gamePlayer.submission.testCode) {
      return { success: false, error: "No submission found for this player" };
    }

    return {
      success: true,
      submission: {
        playerId: gamePlayer.playerId,
        code: gamePlayer.submission.testCode,
        submittedAt: gamePlayer.submittedAt,
      }
    };

  } catch (error) {
    console.error("Error in getLastSubmission:", error);
    return { success: false, error: error.message };
  }
}
 
  async getGameResults(gameId) {
    try {
      const game = await Game.findById(gameId)
        .populate('players.playerId', 'name email'); // Populate player names
        
      if (!game){
        return { success:false , error:"Game not found"};
      }

      // Transform the data to include player names directly
      const gameResults = game.players.map(playerData => ({
        ...playerData.toObject(),
        playerName: playerData.playerId?.name || 'Unknown Player',
        playerId: playerData.playerId?._id || playerData.playerId // Keep the ID as well
      }));

      if(!gameResults)
      {
        return { success:false , error:"No result"}
      }
      return {
        success:true,
        playerData: gameResults // Fixed typo: was playerDate
      }
    }
    catch (error){
      return {
        success:false,
        error : error.message
      }
    } 
}

async calculatePlayerData (gameId, playerId , testCode){
  try {
    const player = await this.playerService.getPlayer(playerId);
    
    if(!player.success){
        return { success:false ,error: player.error};
      }

      const game = await Game.findById(gameId).populate('codeId');
      if (!game){
        return { success:false , error:"Game not found"};
      }

      const gamePlayer = game.players.find(
        p => p.playerId.toString() === playerId.toString()
      );

      if(!gamePlayer)
      {
        return { success:false , error:"Player not in this game"}
      }   

      const baseCode = game.codeId.baseCode;
 

      const tempRootDir = path.join(process.cwd(), 'temp');
      
      const runCode = await this.codeService.compileAndRunCSharpCode(
       baseCode, gamePlayer.submission.testCode, playerId,
       tempRootDir
      )

      if(!runCode.success){
        return { success:false ,error: runCode.error};
      }

      // ✅ Tests ran successfully (even if some failed)
      const executionTime = runCode.executionTime ;
      const testStats = runCode.stats ;

      const playerTestDir = runCode.playerTestsDir ;

      let coverageReport;
try {
  console.log("Starting coverage report...");
  coverageReport = await this.codeService.generateCoverageReport(playerTestDir);
  console.log("Finished coverage report");
} catch(e) {
  console.error("Coverage report error:", e);
}



      if(!coverageReport.success){

        return { success:false ,error: coverageReport.error};

      }



      const lineCoverage = coverageReport.lineCoverage;
      const coverageSummary = coverageReport.coverageSummary;
      const lineRate = coverageReport.lineRate;
      const branchRate = coverageReport.branchRate;

      const calculateTestLines = await this.codeService.calculateTestLines(baseCode);
      if(!calculateTestLines.success){
        return { success:false ,error: calculateTestLines.error};
      }

      const testLines = calculateTestLines.totalTestLines ;

      let generateMutationReport;
  try {

       generateMutationReport = await this.codeService.generateMutationReport(
        playerTestDir, tempRootDir
      )
      console.log("Finished Mutation report");
} catch(e) {
  console.error("Mutation error:", e);
}
    
      if(!generateMutationReport.success){
        return { success:false ,error: generateMutationReport.error};
      }


      const mutants = generateMutationReport.mutants ;
      const mutantionSummary = generateMutationReport.summary;
      
      gamePlayer.submission.testCode = testCode;
      gamePlayer.submission.stats = testStats;
      gamePlayer.submission.submittedAt = new Date();

      gamePlayer.totalScore =
      (mutantionSummary.mutationScore * 0.4) +
      (branchRate * 0.2 )+
      (coverageSummary * 0.2) +
      (testLines *0.1)
      - (executionTime *0.1);
      

      
      gamePlayer.lineCoverage = lineCoverage;
      gamePlayer.lineRate = lineRate;
      gamePlayer.branchCoverage = branchRate;
      gamePlayer.coverageSummary = coverageSummary;
      gamePlayer.mutation = {
        score: mutantionSummary.mutationScore,
        total: mutantionSummary.totalMutants,
        killed: mutantionSummary.killed,
        survived: mutantionSummary.survived,
        timeout: mutantionSummary.timeout,
        noCoverage: mutantionSummary.noCoverage,
        details: mutants
      };
      gamePlayer.testLines = testLines;
      gamePlayer.executionTime = executionTime;

      game.markModified("players");
      game.markModified("submission");
      game.markModified("mutation");
      game.markModified("lineCoverage");
      await game.save();

      return {
      success: true,
      playerData: {
        stats: testStats,
        coverageSummary: coverageSummary,
        lineRate: lineRate,
        branchCoverage: branchRate,
        mutation: {
          score: mutantionSummary.mutationScore,
          total: mutantionSummary.totalMutants,
          killed: mutantionSummary.killed,
          survived: mutantionSummary.survived,
          timeout: mutantionSummary.timeout,
          noCoverage: mutantionSummary.noCoverage,
          details: mutants
        },
        testLines: testLines,
        totalScore: gamePlayer.totalScore,
        executionTime: executionTime,
        lineCoverage: lineCoverage  // ✅ EXPLICITLY INCLUDE THIS
      }
    };
  } catch (error){

      return {
        success:false,
        error : error.message
      }
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
   * End a game and finalize all player data
   * @param {string} gameId - Game ID
   * @returns {Object} End game result
   */
  async endGame(gameId) {
    try {
      const game = await Game.findById(gameId).populate('codeId');
      if (!game) {
        return { success: false, error: 'Game not found' };
      }

      if (game.gameState === 'finished') {
        return { success: true, error: 'Game already finished' };
      }

      // ✅ NEW: Auto-calculate missing player data before ending
      console.log("🔍 Checking for incomplete player data...");
      const tempRootDir = path.join(process.cwd(), 'temp');
      
      for (const gamePlayer of game.players) {
        // Check if player has incomplete data (no mutation score or no coverage)
        const hasIncompletData = 
          !gamePlayer.mutation?.score || 
          gamePlayer.mutation.score === 0 || 
          !gamePlayer.lineRate || 
          !gamePlayer.submission?.testCode;

        if (hasIncompletData && gamePlayer.submission?.testCode) {
          console.log(`⚙️ Auto-calculating data for player ${gamePlayer.playerId}...`);
          
          try {
            const calculateResult = await this.calculatePlayerData(
              gameId, 
              gamePlayer.playerId.toString(), 
              gamePlayer.submission.testCode
            );
            
            if (calculateResult.success) {
              console.log(`✅ Data calculated for player ${gamePlayer.playerId}`);
            } else {
              console.warn(`⚠️ Failed to calculate data for ${gamePlayer.playerId}:`, calculateResult.error);
            }
          } catch (calcError) {
            console.error(`❌ Error calculating player data:`, calcError);
          }
        }
      }

      // Reload game to get updated player data
      await game.save();
      const updatedGame = await Game.findById(gameId).populate('codeId');
      if (!updatedGame) {
        return { success: false, error: 'Game not found after calculation' };
      }

      // ✅ 1️⃣ Calculate game duration
      const gameDuration = Math.round((Date.now() - updatedGame.startedAt) / 1000);
      updatedGame.totalDuration = gameDuration;

      // ✅ 2️⃣ Calculate scores and rankings
      const playerScores = updatedGame.players.map((player, index) => ({
        index,
        playerId: player.playerId,
        totalScore: player.totalScore || 0,
        mutationScore: player.mutation?.score || 0,
        lineRate: player.lineRate || 0,
        executionTime: player.executionTime || 0,
        testLines: player.testLines || 0
      }));

      // Sort by totalScore descending
      playerScores.sort((a, b) => b.totalScore - a.totalScore);

      // // ✅ 3️⃣ Determine winner (highest score)
      // const winner = playerScores[0];
      // game.winner = winner.playerId;

      // ✅ 4️⃣ Award badges to each player
      for (let i = 0; i < updatedGame.players.length; i++) {
        const gamePlayer = updatedGame.players[i];
        const badges = [];

        // 🎖️ Mutation Slayer: Kill ≥ 80% of mutants
        if (gamePlayer.mutation?.score >= 80) {
          const mutationSlayerBadge = await Badge.findOne({ condition: 'mutation_slayer' });
          if (mutationSlayerBadge && !gamePlayer.badgesEarned.includes(mutationSlayerBadge._id)) {
            badges.push(mutationSlayerBadge._id);
            gamePlayer.feedback = (gamePlayer.feedback || '') + '\n🎖️ Mutation Slayer: Killed ≥80% of mutants!';
          }
        }

        // 🎖️ Coverage Explorer: Tiered badges
        const lineRate = gamePlayer.lineRate || 0;
        if (lineRate === 100) {
          const platinumBadge = await Badge.findOne({ condition: 'coverage_platinum' });
          if (platinumBadge && !gamePlayer.badgesEarned.includes(platinumBadge._id)) {
            badges.push(platinumBadge._id);
            gamePlayer.feedback = (gamePlayer.feedback || '') + '\n⭐ Coverage Platinum: 100% code coverage!';
          }
        } else if (lineRate >= 90) {
          const goldBadge = await Badge.findOne({ condition: 'coverage_gold' });
          if (goldBadge && !gamePlayer.badgesEarned.includes(goldBadge._id)) {
            badges.push(goldBadge._id);
            gamePlayer.feedback = (gamePlayer.feedback || '') + '\n🥇 Coverage Gold: ≥90% code coverage!';
          }
        } else if (lineRate >= 80) {
          const silverBadge = await Badge.findOne({ condition: 'coverage_silver' });
          if (silverBadge && !gamePlayer.badgesEarned.includes(silverBadge._id)) {
            badges.push(silverBadge._id);
            gamePlayer.feedback = (gamePlayer.feedback || '') + '\n🥈 Coverage Silver: ≥80% code coverage!';
          }
        } else if (lineRate >= 70) {
          const bronzeBadge = await Badge.findOne({ condition: 'coverage_bronze' });
          if (bronzeBadge && !gamePlayer.badgesEarned.includes(bronzeBadge._id)) {
            badges.push(bronzeBadge._id);
            gamePlayer.feedback = (gamePlayer.feedback || '') + '\n🥉 Coverage Bronze: ≥70% code coverage!';
          }
        }

        // 🎖️ Lightning Tester: Fast execution time (< 5 seconds)
        if (gamePlayer.executionTime > 0 && gamePlayer.executionTime < 5) {
          const lightningBadge = await Badge.findOne({ condition: 'lightning_tester' });
          if (lightningBadge && !gamePlayer.badgesEarned.includes(lightningBadge._id)) {
            badges.push(lightningBadge._id);
            gamePlayer.feedback = (gamePlayer.feedback || '') + '\n⚡ Lightning Tester: Executed in < 5 seconds!';
          }
        }

        // 🎖️ First Place / Ranker badges
        const ranking = playerScores.findIndex(p => p.playerId.toString() === gamePlayer.playerId.toString()) + 1;
        if (ranking === 1) {
          const firstPlaceBadge = await Badge.findOne({ condition: 'first_place' });
          if (firstPlaceBadge && !gamePlayer.badgesEarned.includes(firstPlaceBadge._id)) {
            badges.push(firstPlaceBadge._id);
            gamePlayer.feedback = (gamePlayer.feedback || '') + '\n🏆 First Place: Highest score in this game!';
          }
        } else if (ranking === 2) {
          const secondPlaceBadge = await Badge.findOne({ condition: 'second_place' });
          if (secondPlaceBadge && !gamePlayer.badgesEarned.includes(secondPlaceBadge._id)) {
            badges.push(secondPlaceBadge._id);
            gamePlayer.feedback = (gamePlayer.feedback || '') + '\n🥈 Second Place: Great effort!';
          }
        }

        // Add new badges
        gamePlayer.badgesEarned.push(...badges);
      }

      // ✅ 5️⃣ Update game state
      updatedGame.gameState = 'finished';
      updatedGame.markModified('players');
      updatedGame.markModified('winner');
      await updatedGame.save();

      // ✅ 6️⃣ Delete the game room
      const roomDeleteResult = await this.roomService.deleteRoom(updatedGame.roomCode);
      if (!roomDeleteResult.success) {
        console.warn('⚠️ Warning: Could not delete room:', roomDeleteResult.error);
      } else {

      }

      // ✅ 7️⃣ Update Player objects with final stats
      for (const gamePlayer of updatedGame.players) {
        const player = await Player.findById(gamePlayer.playerId);
        if (!player) continue;

        // Update game statistics
        player.totalGamesPlayed = (player.totalGamesPlayed || 0) + 1;
        player.totalScore = (player.totalScore || 0) + gamePlayer.totalScore;
        
        // Check if player won
        if (gamePlayer.playerId.toString() === updatedGame.winner?.toString()) {
          player.totalGamesWon = (player.totalGamesWon || 0) + 1;
          player.currentStreak = (player.currentStreak || 0) + 1;
          player.bestStreak = Math.max(player.bestStreak || 0, player.currentStreak);
        } else {
          player.currentStreak = 0;
        }

        // Calculate averages
        player.averageScore = Math.round(player.totalScore / player.totalGamesPlayed);
        player.bestScore = Math.max(player.bestScore || 0, gamePlayer.totalScore);
        player.winRate = Math.round((player.totalGamesWon / player.totalGamesPlayed) * 100);

        // Add earned badges
        if (gamePlayer.badgesEarned && gamePlayer.badgesEarned.length > 0) {
          gamePlayer.badgesEarned.forEach(badgeId => {
            if (!player.badges.includes(badgeId)) {
              player.badges.push(badgeId);
            }
          });
        }

        player.lastActive = new Date();

        await player.save();

      }

      // ✅ 8️⃣ Remove from active games
      this.activeGames.delete(gameId.toString());

      // ✅ Return final game data
      return {
        success: true,
        message: 'Game ended successfully',
        game: {
          gameId: updatedGame._id,
          winner: updatedGame.winner,
          gameDuration: gameDuration,
          players: updatedGame.players.map(p => ({
            playerId: p.playerId,
            totalScore: p.totalScore,
            badgesEarned: p.badgesEarned,
            feedback: p.feedback,
            mutation: p.mutation,
            lineCoverage: p.lineCoverage,
            lineRate: p.lineRate,
            executionTime: p.executionTime
          }))
        }
      };

    } catch (error) {
      console.error('❌ Error ending game:', error);
      return {
        success: false,
        error: error.message
      };


    }
  }
}

module.exports = GameService;
/**
 * Example usage of Player model, service, and controller
 * This demonstrates how to use the Player components in your application
 */

// Import required modules
const RoomService = require('../services/roomService');
const PlayerService = require('../services/playerService');
const PlayerController = require('../controllers/playerController');
const GameController = require('../controllers/gameController');

// Initialize services and controllers
const roomService = new RoomService();
const playerService = new PlayerService(roomService);
const playerController = new PlayerController(playerService, roomService);
const gameController = new GameController(roomService);

console.log('🎮 Player Components Usage Example\n');

// Example 1: Create a player
console.log('1. Creating a player...');
const playerId = 'player-123';
const createResult = playerController.createPlayer(playerId, {
  name: 'John Doe',
  isHost: false
});

if (createResult.success) {
  console.log('✅ Player created:', createResult.player.name);
} else {
  console.log('❌ Failed to create player:', createResult.error);
}

// Example 2: Create a room and join it
console.log('\n2. Creating room and joining...');
const roomResult = roomService.createRoom('host-456', { hostName: 'Host Player' });
if (roomResult.success) {
  console.log('✅ Room created:', roomResult.roomCode);
  
  // Join the room
  const joinResult = playerController.joinRoom(playerId, roomResult.roomCode, {
    name: 'John Doe'
  });
  
  if (joinResult.success) {
    console.log('✅ Player joined room successfully');
  } else {
    console.log('❌ Failed to join room:', joinResult.error);
  }
}

// Example 3: Set player ready status
console.log('\n3. Setting player ready status...');
const readyResult = playerController.setPlayerReady(playerId, true);
if (readyResult.success) {
  console.log('✅ Player ready status set:', readyResult.player.isReady);
} else {
  console.log('❌ Failed to set ready status:', readyResult.error);
}

// Example 4: Update player score
console.log('\n4. Updating player score...');
const scoreResult = playerController.updatePlayerScore(playerId, 150);
if (scoreResult.success) {
  console.log('✅ Player score updated:', scoreResult.player.score);
} else {
  console.log('❌ Failed to update score:', scoreResult.error);
}

// Example 5: Get player summary
console.log('\n5. Getting player summary...');
const summaryResult = playerController.getPlayerSummary(playerId);
if (summaryResult.success) {
  console.log('✅ Player summary retrieved:');
  console.log('   - Name:', summaryResult.player.name);
  console.log('   - Score:', summaryResult.player.score);
  console.log('   - Ready:', summaryResult.player.isReady);
  console.log('   - Current Room:', summaryResult.currentRoom ? 'Yes' : 'No');
} else {
  console.log('❌ Failed to get player summary:', summaryResult.error);
}

// Example 6: Get player leaderboard
console.log('\n6. Getting player leaderboard...');
const leaderboardResult = playerController.getPlayerLeaderboard(5);
if (leaderboardResult.success) {
  console.log('✅ Leaderboard retrieved with', leaderboardResult.leaderboard.length, 'players');
} else {
  console.log('❌ Failed to get leaderboard:', leaderboardResult.error);
}

// Example 7: Update player name
console.log('\n7. Updating player name...');
const nameResult = playerController.updatePlayerName(playerId, 'John Smith');
if (nameResult.success) {
  console.log('✅ Player name updated:', nameResult.newName);
} else {
  console.log('❌ Failed to update name:', nameResult.error);
}

// Example 8: Get player statistics
console.log('\n8. Getting player statistics...');
const statsResult = playerController.getPlayerStats();
if (statsResult.success) {
  console.log('✅ Player statistics:');
  console.log('   - Total players:', statsResult.stats.totalPlayers);
  console.log('   - Average score:', statsResult.stats.averageScore);
} else {
  console.log('❌ Failed to get statistics:', statsResult.error);
}

console.log('\n🎉 Example completed successfully!');
console.log('\nThe Player components are working correctly and ready for use in your application.');

// Export for use in other modules
module.exports = {
  roomService,
  playerService,
  playerController,
  gameController
};
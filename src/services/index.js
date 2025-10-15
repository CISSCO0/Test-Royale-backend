const AuthService = require('./authService');
const PlayerService = require('./playerService');
const RoomService = require('./roomService');
const GameService = require('./gameService');
const CodeService = require('./codeService');
const AchievementService = require('./achievementService');
const BadgeService = require('./badgeService');
const LeaderboardService = require('./leaderboardService');

// Create service instances
const authService = new AuthService();
const playerService = new PlayerService();
const roomService = new RoomService();
const gameService = new GameService();
const codeService = new CodeService();
const achievementService = new AchievementService();
const badgeService = new BadgeService();
const leaderboardService = new LeaderboardService();

module.exports = {
  // Service classes
  AuthService,
  PlayerService,
  RoomService,
  GameService,
  CodeService,
  AchievementService,
  BadgeService,
  LeaderboardService,
  
  // Service instances
  authService,
  playerService,
  roomService,
  gameService,
  codeService,
  achievementService,
  badgeService,
  leaderboardService
};
# Test Royale Services

This directory contains all the business logic services for the Test Royale multiplayer educational game backend.

## Services Overview

### 🔐 AuthService
Handles user authentication, registration, login, logout, and profile management.

**Key Features:**
- User registration and login
- JWT token generation and verification
- Password hashing and validation
- Profile management
- Password change functionality

**Usage:**
```javascript
const { authService } = require('./services');

// Register a new player
const result = await authService.register({
  email: 'player@example.com',
  password: 'password123',
  name: 'Player Name'
});

// Login
const loginResult = await authService.login({
  email: 'player@example.com',
  password: 'password123'
});
```

### 👤 PlayerService
Manages player data, statistics, and player-related operations.

**Key Features:**
- Player profile management
- Statistics tracking
- Player search and filtering
- Leaderboard generation
- Achievement and badge tracking

**Usage:**
```javascript
const { playerService } = require('./services');

// Get player profile
const player = await playerService.getPlayer(playerId);

// Update player stats after game
await playerService.updatePlayerStats(playerId, {
  score: 85,
  won: true,
  gameDuration: 180
});
```

### 🏠 RoomService
Handles room creation, joining, leaving, and management.

**Key Features:**
- Room creation and management
- Player joining and leaving
- Ready status management
- Game state tracking
- Room cleanup

**Usage:**
```javascript
const { roomService } = require('./services');

// Create a room
const room = await roomService.createRoom(hostId, {
  maxPlayers: 4,
  codeLength: 6
});

// Join a room
const joinResult = await roomService.joinRoom(playerId, roomCode);
```

### 🎮 GameService
Manages game sessions, scoring, and game flow.

**Key Features:**
- Game initialization and management
- Test code submission
- Score calculation
- Game state management
- Achievement and badge awarding

**Usage:**
```javascript
const { gameService } = require('./services');

// Start a game
const game = await gameService.startGame(roomCode, codeId);

// Submit test code
await gameService.submitTestCode(gameId, playerId, testCode);

// Calculate scores
const results = await gameService.calculateScores(gameId);
```

### 📝 CodeService
Manages programming challenges and code templates.

**Key Features:**
- Challenge creation and management
- Language-specific challenges
- Random challenge selection
- Challenge search and filtering

**Usage:**
```javascript
const { codeService } = require('./services');

// Get all challenges
const challenges = await codeService.getAllChallenges({
  language: 'python',
  limit: 10
});

// Get random challenge
const randomChallenge = await codeService.getRandomChallenge('java');
```

### 🏆 AchievementService
Handles player achievements and progress tracking.

**Key Features:**
- Achievement management
- Progress tracking
- Automatic achievement awarding
- Achievement statistics

**Usage:**
```javascript
const { achievementService } = require('./services');

// Get player achievements
const achievements = await achievementService.getPlayerAchievements(playerId);

// Check and award achievements
const newAchievements = await achievementService.checkAndAwardAchievements(playerId, gameResult);
```

### 🎖️ BadgeService
Manages player badges and special recognitions.

**Key Features:**
- Badge management
- Condition-based awarding
- Badge statistics
- Player badge tracking

**Usage:**
```javascript
const { badgeService } = require('./services');

// Get player badges
const badges = await badgeService.getPlayerBadges(playerId);

// Check and award badges
const newBadges = await badgeService.checkAndAwardBadges(playerId, gameResult, playerStats);
```

### 📊 LeaderboardService
Provides ranking and leaderboard functionality.

**Key Features:**
- Overall leaderboards
- Weekly and monthly rankings
- Player ranking calculation
- Statistics and analytics

**Usage:**
```javascript
const { leaderboardService } = require('./services');

// Get overall leaderboard
const leaderboard = await leaderboardService.getOverallLeaderboard({
  limit: 50,
  sortBy: 'totalScore'
});

// Get player ranking
const ranking = await leaderboardService.getPlayerRanking(playerId, 'weekly');
```

## Service Initialization

The services can be initialized with default data using the initialization utility:

```javascript
const { initializeServices, checkServiceStatus } = require('./services/initializeServices');

// Initialize all services with default data
const initResult = await initializeServices();

// Check if services are properly initialized
const status = await checkServiceStatus();
```

## Default Data

The services come with default data:

### Code Challenges
- Simple Calculator (Python)
- Palindrome Checker (Python)
- Array Sum (Java)
- String Reverser (C#)

### Achievements
- First Victory
- Win Streak Master
- Dedicated Player
- High Scorer
- Test Coverage Expert
- Speed Demon
- Perfectionist
- Veteran
- Champion
- Legend

### Badges
- Hot Streak
- Rookie
- Consistent Winner
- Speed Runner
- Test Master
- Code Warrior
- Marathon Player
- Night Owl
- Early Bird
- Weekend Warrior

## Error Handling

All services return consistent error responses:

```javascript
{
  success: false,
  error: 'Error message',
  // Additional error details if needed
}
```

## Success Responses

All services return consistent success responses:

```javascript
{
  success: true,
  // Service-specific data
  message: 'Operation completed successfully' // Optional
}
```

## Database Models

The services work with the following MongoDB models:

- **Player**: User accounts and statistics
- **Room**: Game rooms and player management
- **Game**: Game sessions and results
- **Code**: Programming challenges
- **Achievement**: Player achievements
- **Badge**: Player badges

## Dependencies

- **MongoDB**: Database storage
- **Mongoose**: ODM for MongoDB
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token management
- **validator**: Input validation

## Usage in Controllers

Services are designed to be used in Express.js controllers:

```javascript
const { authService, gameService } = require('../services');

// In a controller
exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
```

## Testing

Each service can be tested independently:

```javascript
const { playerService } = require('./services');

// Test player creation
const result = await playerService.getPlayer('playerId');
console.log(result);
```

## Performance Considerations

- Services use database queries efficiently
- Leaderboard service includes caching
- Room service maintains in-memory cache for active rooms
- Pagination is implemented for large datasets

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Input validation is performed on all user inputs
- SQL injection is prevented through Mongoose ODM
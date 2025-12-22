# 🎮 Test Royale - Backend

> High-performance Node.js backend API for Test Royale, a competitive multiplayer platform for software testing battles.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-black)](https://socket.io/)
[![Deployed on Railway](https://img.shields.io/badge/Deployed-Railway-purple)](https://railway.app/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Services](#services)
- [Testing Workflow](#testing-workflow)
- [Deployment](#deployment)

## 🌟 Overview

Test Royale Backend is a robust, scalable Node.js API that powers a real-time multiplayer competitive testing platform. It orchestrates C# test execution, code coverage analysis, mutation testing, and real-time game state management for up to hundreds of concurrent players.

**Live API:** [https://test-royale-backend.up.railway.app](https://test-royale-backend.up.railway.app)

## ✨ Features

### 🎮 Real-time Multiplayer
- **WebSocket Communication** - Socket.io for instant updates
- **Room Management** - Create, join, and manage game lobbies
- **Player Ready System** - Synchronized game start mechanism
- **Live Game State** - Real-time score updates and rankings

### 🧪 Advanced Testing Pipeline
- **C# Test Execution** - Compile and run MSTest projects
- **Code Coverage Analysis** - Coverlet integration with XML reports
- **Mutation Testing** - Stryker.NET for comprehensive mutation analysis
- **Concurrent Queue System** - p-queue for handling multiple test executions (max 3 concurrent)
- **Automatic Cleanup** - 2-minute temp file cleanup

### 📊 Scoring & Analytics
- **Multi-factor Scoring Algorithm**:
  - Mutation Score (40%)
  - Branch Coverage (20%)
  - Line Coverage (20%)
  - Test Lines (10%)
  - Execution Time (-10%)
- **Real-time Leaderboards** - Global and player-specific rankings
- **Badge System** - Achievement-based recognition
- **PDF Report Generation** - pdfkit-powered performance reports

### 🔐 Security & Performance
- **JWT Authentication** - Secure token-based auth
- **Request Queue** - Prevents server overload (max 3 concurrent)
- **Input Validation** - Comprehensive validation middleware
- **Error Handling** - Graceful error recovery
- **Auto-calculation** - Ensures complete data before game end

## 🏗️ Architecture

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Frontend  │◄─────►│   Backend    │◄─────►│   MongoDB   │
│  (Next.js)  │       │  (Express)   │       │  (Database) │
└─────────────┘       └──────────────┘       └─────────────┘
                             │
                             ├─────────► C# Test Execution
                             │           (dotnet CLI)
                             │
                             ├─────────► Coverage Analysis
                             │           (Coverlet)
                             │
                             └─────────► Mutation Testing
                                         (Stryker.NET)
```

## 🛠️ Tech Stack

### Core
- **Node.js 18+** - JavaScript runtime
- **Express.js 4.18** - Web framework
- **MongoDB 6+** - NoSQL database
- **Mongoose** - MongoDB ODM

### Real-time & Queue
- **Socket.io 4** - WebSocket communication
- **p-queue 8** - Promise-based queue with concurrency control

### Testing Tools
- **.NET SDK 6+** - Required for C# compilation
- **Coverlet** - Code coverage tool
- **Stryker.NET** - Mutation testing framework
- **MSTest** - Testing framework

### Utilities
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **pdfkit** - PDF report generation
- **xml2js** - XML parsing for coverage reports
- **nodemon** - Development auto-restart

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 18.0.0
MongoDB >= 6.0.0
.NET SDK >= 6.0.0
npm >= 9.0.0
```

### Installation

```bash
# Clone the repository
git clone https://github.com/CISSCO0/Test-Royale-backend.git
cd Test-Royale-backend

# Install dependencies
npm install

# Install .NET tools globally
dotnet tool install --global coverlet.console
dotnet tool install --global dotnet-stryker

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

The server will start on `http://localhost:3000`

### Build for Production

```bash
# Start production server
npm start
```

## 📁 Project Structure

```
Backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── authController.js
│   │   ├── gameController.js
│   │   ├── roomController.js
│   │   └── codeController.js
│   ├── services/            # Business logic
│   │   ├── authService.js
│   │   ├── gameService.js
│   │   ├── codeService.js   # Test execution & analysis
│   │   ├── roomService.js
│   │   └── playerService.js
│   ├── models/              # Mongoose schemas
│   │   ├── player.js
│   │   ├── game.js
│   │   ├── room.js
│   │   └── code.js
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── gameRoutes.js
│   │   └── codeRoutes.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── sockets/             # Socket.io handlers
│   │   └── gameSocket.js
│   └── utils/               # Utility functions
├── CSharpTemplate/          # C# project templates
│   ├── PlayerCode/          # Base code project
│   └── PlayerTests/         # Test project template
├── temp/                    # Temporary test execution files
├── server.js               # Application entry point
└── package.json
```

## 📡 API Documentation

### Authentication

#### Register Player
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Player Name",
  "email": "player@example.com",
  "password": "securepassword"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "token": "jwt_token",
  "playerId": "player_id"
}
```

### Room Management

#### Create Room
```http
POST /api/rooms/create
Authorization: Bearer <token>

{
  "playerId": "player_id"
}

Response:
{
  "success": true,
  "room": {
    "code": "ABC123",
    "hostId": "player_id",
    "players": [...],
    "gameState": "waiting"
  }
}
```

#### Join Room
```http
POST /api/rooms/join
Authorization: Bearer <token>

{
  "playerId": "player_id",
  "roomCode": "ABC123"
}
```

#### Set Ready Status
```http
POST /api/rooms/ready
Authorization: Bearer <token>

{
  "playerId": "player_id",
  "roomCode": "ABC123"
}
```

### Game Operations

#### Start Game
```http
POST /api/game/start
Authorization: Bearer <token>

{
  "playerId": "player_id"
}

Response:
{
  "success": true,
  "game": {
    "_id": "game_id",
    "roomCode": "ABC123",
    "codeId": "challenge_id",
    "players": [...],
    "startedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Submit Test Code
```http
POST /api/game/submit
Authorization: Bearer <token>

{
  "gameId": "game_id",
  "playerId": "player_id",
  "testCode": "/* C# test code */"
}
```

#### Calculate Player Data
```http
POST /api/game/calculate
Authorization: Bearer <token>

{
  "playerId": "player_id",
  "gameId": "game_id"
}

Response:
{
  "success": true,
  "playerData": {
    "stats": { "passed": 10, "failed": 0, "total": 10 },
    "coverageSummary": 95.5,
    "lineRate": 95.5,
    "branchCoverage": 90.0,
    "mutation": {
      "score": 85.0,
      "killed": 17,
      "survived": 3,
      "total": 20
    },
    "testLines": 45,
    "totalScore": 87.3,
    "executionTime": 3.5
  }
}
```

#### End Game
```http
POST /api/game/end
Authorization: Bearer <token>

{
  "gameId": "game_id"
}
```

#### Get Game Results
```http
GET /api/game/results/:gameId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "playerData": [
    {
      "playerId": "player_id",
      "playerName": "Player Name",
      "totalScore": 87.3,
      "lineRate": 95.5,
      "mutation": {...},
      "submission": {...}
    }
  ]
}
```

### Code Execution

#### Compile and Run C# Code
```http
POST /api/code/compile
Authorization: Bearer <token>

{
  "baseCode": "/* C# base code */",
  "testCode": "/* C# test code */",
  "playerId": "player_id"
}

Response:
{
  "success": true,
  "stdout": "Test execution output",
  "stats": {
    "passed": 10,
    "failed": 0,
    "total": 10,
    "executionTime": "3.50"
  }
}
```

#### Generate PDF Report
```http
POST /api/code/generatePDFReport
Authorization: Bearer <token>

{
  "playerId": "player_id",
  "gameId": "game_id"
}

Response: PDF file (application/pdf)
```

### Leaderboard

#### Get Global Leaderboard
```http
GET /api/leaderboard
Authorization: Bearer <token>

Response:
{
  "success": true,
  "leaderboard": [
    {
      "playerId": "player_id",
      "name": "Player Name",
      "totalScore": 1250,
      "totalGamesWon": 15,
      "winRate": 75
    }
  ]
}
```

## 🔧 Services Overview

### CodeService
Handles C# compilation, test execution, coverage, and mutation testing.

**Key Methods:**
```javascript
// Compile and run tests (queued, max 3 concurrent)
await codeService.compileAndRunCSharpCode(baseCode, testCode, playerId, tempDir);

// Generate coverage report
await codeService.generateCoverageReport(projectDir);

// Run mutation testing
await codeService.generateMutationReport(projectDir, tempDir);

// Generate PDF report
await codeService.generatePDFReport(playerId, gameId);

// Calculate test lines
await codeService.calculateTestLines(testCode);
```

**Request Queue:**
- Uses `p-queue` with concurrency limit of 3
- Prevents server overload during competitions
- Logs queue status: `🔄 Queue Status: X pending, Y running`

### GameService
Manages game sessions, scoring, and player data calculation.

**Key Methods:**
```javascript
// Start new game
await gameService.startGame(playerId);

// Submit test code
await gameService.submitTestCode(gameId, playerId, testCode);

// Calculate player performance
await gameService.calculatePlayerData(gameId, playerId, testCode);

// End game (auto-calculates missing data)
await gameService.endGame(gameId);

// Get game results
await gameService.getGameResults(gameId);
```

**Auto-calculation Feature:**
- `endGame()` checks for incomplete player data
- Automatically runs `calculatePlayerData()` if needed
- Ensures all players have complete results

### RoomService
Handles room creation, joining, and state management.

**Key Methods:**
```javascript
// Create room
await roomService.createRoom(hostId);

// Join room
await roomService.joinRoom(playerId, roomCode);

// Set player ready
await roomService.setPlayerReady(playerId, roomCode);

// Update game state
await roomService.updateRoomGameState(roomCode, state, data);
```

### PlayerService
Manages player profiles and statistics.

**Key Methods:**
```javascript
// Get player
await playerService.getPlayer(playerId);

// Update stats
await playerService.updatePlayerStats(playerId, stats);

// Get leaderboard
await playerService.getLeaderboard();
```

## 🧪 Testing Workflow

### C# Test Execution Pipeline

```mermaid
graph TD
    A[Submit Test Code] --> B[Add to Queue]
    B --> C[Compile PlayerCode]
    C --> D[Compile PlayerTests]
    D --> E[Run dotnet test]
    E --> F[Extract Console Output]
    F --> G[Generate Coverage Report]
    G --> H[Run Stryker Mutation Testing]
    H --> I[Calculate Total Score]
    I --> J[Save to Database]
    J --> K[Schedule Cleanup 2min]
```

### Scoring Algorithm

```javascript
totalScore = 
  (mutationScore * 0.4) +
  (branchCoverage * 0.2) +
  (lineCoverage * 0.2) +
  (testLines * 0.1) -
  (executionTime * 0.1)
```

### Cleanup Strategy
- **Timeout**: 2 minutes after test execution
- **Location**: `/temp/player_<id>_<timestamp>/`
- **Contents**: C# projects, coverage reports, mutation results

## 🔐 Environment Variables

Create `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/test-royale
# OR MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/test-royale

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-url.com

# Optional: Socket.io configuration
SOCKET_CORS_ORIGIN=https://your-frontend-url.com
```

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start with nodemon (auto-restart)

# Production
npm start                # Start production server

# Database
npm run seed             # Seed database with sample data
npm run migrate          # Run database migrations

# Utilities
npm run clean:temp       # Clean temporary test files
```

## 🚢 Deployment

### Railway (Current Deployment)

1. **Connect Repository:**
   - Link GitHub repository to Railway
   - Select backend directory as root

2. **Configure Environment:**
   - Add all environment variables in Railway dashboard
   - Set `MONGODB_URI` to MongoDB Atlas connection string

3. **Install .NET SDK:**
   - Railway automatically detects Node.js
   - Add build command: `apt-get update && apt-get install -y dotnet-sdk-6.0`

4. **Deploy:**
   - Railway auto-deploys on push to `main`
   - Build Command: `npm install`
   - Start Command: `npm start`

### Docker Deployment

```dockerfile
FROM node:18-alpine

# Install .NET SDK
RUN apk add --no-cache dotnet6-sdk

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## 🔧 Troubleshooting

### Common Issues

**Issue: .NET compilation fails**
```bash
# Verify .NET SDK installation
dotnet --version

# Install required tools
dotnet tool install --global coverlet.console
dotnet tool install --global dotnet-stryker
```

**Issue: MongoDB connection fails**
```
Solution: Check MONGODB_URI in .env
Ensure MongoDB is running (local) or accessible (Atlas)
Verify network access and firewall rules
```

**Issue: Queue not processing**
```
Solution: Check server logs for queue status
Restart server to clear stuck queue
Verify p-queue is installed: npm list p-queue
```

**Issue: Temp files filling disk**
```bash
# Manual cleanup
npm run clean:temp

# Or direct command
rm -rf temp/player_*
```

## 📊 Performance Metrics

- **Test Execution**: 2-5 seconds (C# compilation)
- **Coverage Analysis**: 1-2 seconds (Coverlet)
- **Mutation Testing**: 10-30 seconds (Stryker)
- **Total Per Player**: ~15-40 seconds
- **Concurrent Limit**: 3 simultaneous executions
- **Queue Capacity**: Unlimited (memory-based)




**Built with ❤️ using Node.js, Express, and .NET**

const Room = require('../models/room');
const Player = require('../models/player');
const { generateUniqueRoomCode, isValidRoomCode } = require('../utils/generateCode');
const mongoose = require('mongoose');

class RoomService {
  constructor() {
    this.activeRooms = new Map(); // In-memory storage for active rooms
  }

  /**
   * Create a new room
   * @param {string} hostId - Host player ID
   * @param {Object} options - Room options
   * @returns {Object} Created room or error
   */
  async createRoom(hostId, options = {}) {
    try {
    
      // Check if host exists
      const host = await Player.findById(hostId);
      if (!host) {
        return {
          success: false,
          error: 'Host player not found'
        };
      } 
    
      // Check if host is already in a room
      const existingRoom = await Room.findOne({ 
        'players.playerId': hostId,
        gameState: { $in: ['waiting', 'playing'] }
      });

      if (existingRoom) {
        return {
          success: false,
          error: 'Player is already in a room',
          roomCode: existingRoom.code
        };
      }

      // Generate unique room code
      const roomCode = generateUniqueRoomCode(this.activeRooms, options.codeLength || 6);
    
      // Create new room
      const room = new Room({
        code: roomCode,
        hostId,
        maxPlayers: options.maxPlayers || 4,
        players: [{
          playerId: new mongoose.Types.ObjectId(hostId),
          name: host.name,
          isReady: false,
          isHost: true,
          score: 0,
          joinedAt: new Date()
        }],
        gameState: 'waiting'
      });

      await room.save();

      // Store in memory for quick access
      this.activeRooms.set(roomCode, {
        roomId: room._id,
        code: roomCode,
        hostId,
        maxPlayers: room.maxPlayers,
        players: room.players,
        gameState: room.gameState,
        createdAt: room.createdAt
      });

      return {
        success: true,
        room: {
          id: room._id,
          code: room.code,
          hostId: room.hostId,
          maxPlayers: room.maxPlayers,
          players: room.players.map(p => ({
            playerId: p.playerId,
            name: p.name,
            isReady: p.isReady,
            isHost: p.isHost,
            score: p.score,
            joinedAt: p.joinedAt
          })),
          gameState: room.gameState,
          createdAt: room.createdAt
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
   * Get room information
   * @param {string} roomCode - Room code
   * @returns {Object} Room data or error
   */
  async getRoom(roomCode) {
    try {
      const room = await Room.findOne({ code: roomCode })
        .populate('players.playerId', 'name email');

      if (!room) {
        return {
          success: false,
          error: 'Room not found'
        };
      }

      return {
        success: true,
        room: {
          id: room._id,
          code: room.code,
          hostId: room.hostId,
          maxPlayers: room.maxPlayers,
          isPrivate: room.isPrivate,
          players: room.players.map(p => ({
            playerId: p.playerId._id,
            name: p.playerId.name,
            email: p.playerId.email,
            isReady: p.isReady,
            isHost: p.isHost,
            score: p.score,
            joinedAt: p.joinedAt
          })),
          gameState: room.gameState,
          gameData: room.gameData,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt
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
   * Get player's current room
   * @param {string} playerId - Player ID
   * @returns {Object} Room data or error
   */
  async getPlayerRoom(playerId) {
    try {
      const room = await Room.findOne({ 
        'players.playerId': playerId,
        gameState: { $in: ['waiting', 'playing'] }
      }).populate('players.playerId', 'name email');

      if (!room) {
        return {
          success: false,
          error: 'Player is not in any room'
        };
      }

      return {
        success: true,
        room: {
          id: room._id,
          code: room.code,
          hostId: room.hostId,
          maxPlayers: room.maxPlayers,
          isPrivate: room.isPrivate,
          players: room.players.map(p => ({
            playerId: p.playerId._id,
            name: p.playerId.name,
            email: p.playerId.email,
            isReady: p.isReady,
            isHost: p.isHost,
            score: p.score,
            joinedAt: p.joinedAt
          })),
          gameState: room.gameState,
          gameData: room.gameData,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt
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
   * Join an existing room
   * @param {string} playerId - Player ID
   * @param {string} roomCode - Room code to join
   * @returns {Object} Join result or error
   */
  async joinRoom(playerId, roomCode) {
    try {
      // Validate room code format
      if (!isValidRoomCode(roomCode)) {
        return {
          success: false,
          error: 'Invalid room code format'
        };
      }

      // Check if player exists
      const player = await Player.findById(playerId);
      if (!player) {
        return {
          success: false,
          error: 'Player not found'
        };
      }

      // Check if player is already in a room
      const existingRoom = await Room.findOne({ 
        'players.playerId': playerId,
        gameState: { $in: ['waiting', 'playing'] }
      });
      
      if (existingRoom) {
        return {
          success: false,
          error: 'Player is already in a room',
          roomCode: existingRoom.code
        };
      }

      // Find room
      const room = await Room.findOne({ code: roomCode });
      if (!room) {
        return {
          success: false,
          error: 'Room not found'
        };
      }

      // Check if room is full
      if (room.players.length >= room.maxPlayers) {
        return {
          success: false,
          error: 'Room is full'
        };
      }

      // Check if game has already started
      if (room.gameState !== 'waiting') {
        return {
          success: false,
          error: 'Game has already started'
        };
      }

      // Add player to room
      room.players.push({
        playerId: new mongoose.Types.ObjectId(playerId),
        name: player.name,
        isReady: false,
        isHost: false,
        score: 0,
        joinedAt: new Date()
      });

      await room.save();

      // Update in-memory room
      const activeRoom = this.activeRooms.get(roomCode);
      if (activeRoom) {
        activeRoom.players = room.players;
      }

      return {
        success: true,
        room: {
          id: room._id,
          code: room.code,
          hostId: room.hostId,
          maxPlayers: room.maxPlayers,
          players: room.players.map(p => ({
            playerId: p.playerId,
            name: p.name,
            isReady: p.isReady,
            isHost: p.isHost,
            score: p.score,
            joinedAt: p.joinedAt
          })),
          gameState: room.gameState,
          createdAt: room.createdAt
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
   * Leave a room
   * @param {string} playerId - Player ID
   * @returns {Object} Leave result
   */
  async leaveRoom(playerId) {
    
    try {
      console.log("Leaving room for playerId:", playerId);
    
      const room = await Room.findOne({ 
        'players.playerId': playerId,
        gameState: { $in: ['waiting', 'playing'] }
      });

      if (!room) {
        return {
          success: false,
          error: 'Player is not in any room'
        };
      }

      if (room.gameState !== 'waiting') {
        return {
          success: false,
          error: 'Cannot leave room after game has started'
        };
      }
    
      const wasHost = room.hostId.toString() === playerId;
      const playerIndex = room.players.findIndex(p => p.playerId.toString() === playerId);
      
      if (playerIndex === -1) {
        return {
          success: false,
          error: 'Player not found in room'
        };
      }

      // Remove player from room
      room.players.splice(playerIndex, 1);

      let deletedRoom = false;
      
      // If room is empty, delete it
      if (room.players.length === 0) {
        await Room.findByIdAndDelete(room._id);
        this.activeRooms.delete(room.code);
        deletedRoom = true;
      }

  if (!deletedRoom){
      // If host left, assign new host
      if (wasHost ) {
        room.hostId = room.players[0].playerId;
        room.players[0].isHost = true;
      }
      
      await room.save();

      // Update in-memory room
      const activeRoom = this.activeRooms.get(room.code);
      if (activeRoom) {
        activeRoom.players = room.players;
        activeRoom.hostId = room.hostId;
      }

    }
      return {
        success: true,
        room: {
          id: room._id,
          code: room.code,
          hostId: room.hostId,
          maxPlayers: room.maxPlayers,
          players: room.players.map(p => ({
            playerId: p.playerId,
            name: p.name,
            isReady: p.isReady,
            isHost: p.isHost,
            score: p.score,
            joinedAt: p.joinedAt
          })),
          gameState: room.gameState,
          createdAt: room.createdAt
        },
        wasHost,
        newHost: wasHost ? room.hostId : null,
        deletedRoom};
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update player ready status
   * @param {string} playerId - Player ID
   * @param {boolean} isReady - Ready status
   * @returns {Object} Update result
   */
  async setPlayerReady(playerId, isReady) {
    try {
      const room = await Room.findOne({ 
        'players.playerId': playerId,
        gameState: 'waiting'
      });

      if (!room) {
        return {
          success: false,
          error: 'Player is not in a waiting room'
        };
      }

      const playerIndex = room.players.findIndex(p => p.playerId.toString() === playerId);

      if (playerIndex === -1) {
        return {
          success: false,
          error: 'Player not found in room'
        };
      }
      // Update player ready status
      room.players[playerIndex].isReady = isReady;
      room.markModified(`players.${playerIndex}.isReady`);
      await room.save(); 

      // Update in-memory room
      const activeRoom = this.activeRooms.get(room.code);
      if (activeRoom) {
        activeRoom.players = room.players;
      }

      // Check if all players are ready
      const allReady = room.players.every(p => p.isReady);

      return {
        success: true,
        room: {
          id: room._id,
          code: room.code,
          hostId: room.hostId,
          maxPlayers: room.maxPlayers,
          players: room.players.map(p => ({
            playerId: p.playerId,
            name: p.name,
            isReady: p.isReady,
            isHost: p.isHost,
            score: p.score,
            joinedAt: p.joinedAt
          })),
          gameState: room.gameState,
          createdAt: room.createdAt
        },
        allReady
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
//---------------------------------
  /**
   * Update room game state
   * @param {string} roomCode - Room code
   * @param {string} gameState - New game state
   * @param {Object} gameData - Game data
   * @returns {Object} Update result
   */
  async updateRoomGameState(roomCode, gameState, gameData = {}) {
    try {
      const room = await Room.findOne({ code: roomCode });
      if (!room) {
        return {
          success: false,
          error: 'Room not found'
        };
      }

      room.gameState = gameState;
      if (Object.keys(gameData).length > 0) {
        room.gameData = { ...room.gameData, ...gameData };
      }

      await room.save();

      // Update in-memory room
      const activeRoom = this.activeRooms.get(roomCode);
      if (activeRoom) {
        activeRoom.gameState = gameState;
        activeRoom.gameData = room.gameData;
      }

      return {
        success: true,
        room: {
          id: room._id,
          code: room.code,
          hostId: room.hostId,
          maxPlayers: room.maxPlayers,
          players: room.players,
          gameState: room.gameState,
          gameData: room.gameData,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt
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
   * Get all active rooms
   * @param {Object} options - Query options
   * @returns {Object} List of active rooms
   */
  async getAllRooms(options = {}) {
    try {
      const { limit = 50, gameState = null } = options;
      
      const query = {};
      if (gameState) {
        query.gameState = gameState;
      }

      const rooms = await Room.find(query)
        .populate('players.playerId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit);

      return {
        success: true,
        rooms: rooms.map(room => ({
          id: room._id,
          code: room.code,
          hostId: room.hostId,
          maxPlayers: room.maxPlayers,
          currentPlayers: room.players.length,
          players: room.players.map(p => ({
            playerId: p.playerId._id,
            name: p.playerId.name,
            isReady: p.isReady,
            isHost: p.isHost,
            score: p.score
          })),
          gameState: room.gameState,
          createdAt: room.createdAt
        })),
        count: rooms.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up empty rooms
   * @returns {Object} Cleanup result
   */
  async cleanupEmptyRooms() {
    try {
      const emptyRooms = await Room.find({
        $or: [
          { players: { $size: 0 } },
          { gameState: 'finished' }
        ]
      });

      const deletedCount = await Room.deleteMany({
        $or: [
          { players: { $size: 0 } },
          { gameState: 'finished' }
        ]
      });

      // Clean up in-memory rooms
      for (const room of emptyRooms) {
        this.activeRooms.delete(room.code);
      }

      return {
        success: true,
        deletedCount: deletedCount.deletedCount,
        message: `Cleaned up ${deletedCount.deletedCount} empty rooms`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get room statistics
   * @returns {Object} Room statistics
   */
  async getRoomStats() {
    try {
      const totalRooms = await Room.countDocuments();
      const activeRooms = await Room.countDocuments({
        gameState: { $in: ['waiting', 'playing'] }
      });
      
      const roomsByState = await Room.aggregate([
        {
          $group: {
            _id: '$gameState',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalPlayers = await Room.aggregate([
        { $unwind: '$players' },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]);

      return {
        success: true,
        stats: {
          totalRooms,
          activeRooms,
          roomsByState: roomsByState.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          totalPlayers: totalPlayers[0]?.count || 0
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
   * Get active rooms from memory
   * @returns {Array} List of active rooms
   */
  getActiveRooms() {
    return Array.from(this.activeRooms.values());
  }

  /**
   * Clear room from memory
   * @param {string} roomCode - Room code
   */
  clearRoomFromMemory(roomCode) {
    this.activeRooms.delete(roomCode);
  }
}

module.exports = RoomService;
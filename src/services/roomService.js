/**
 * Room service to handle room creation, joining, and management
 */

const Room = require('../models/room');
const { generateUniqueRoomCode, isValidRoomCode } = require('../utils/generateCode');

class RoomService {
  constructor() {
    this.rooms = new Map();
    this.playerToRoom = new Map(); // Maps playerId to roomCode
  }

  /**
   * Create a new room
   * @param {string} hostId - Socket ID of the host
   * @param {Object} options - Room options
   * @returns {Object} Created room or error
   */
  createRoom(hostId, options = {}) {
    try {
      // Check if host is already in a room
      if (this.playerToRoom.has(hostId)) {
        return {
          success: false,
          error: 'Player is already in a room',
          roomCode: this.playerToRoom.get(hostId)
        };
      }

      // Generate unique room code
      const roomCode = generateUniqueRoomCode(this.rooms, options.codeLength || 6);
      
      // Create new room
      const room = new Room(
        roomCode,
        hostId,
        options.maxPlayers || 4
      );

      // Add host to the room
      const hostData = {
        name: options.hostName || 'Host',
        isHost: true,
        ...options.hostData
      };

      if (!room.addPlayer(hostId, hostData)) {
        return {
          success: false,
          error: 'Failed to add host to room'
        };
      }

      // Store room and player mapping
      this.rooms.set(roomCode, room);
      this.playerToRoom.set(hostId, roomCode);

      return {
        success: true,
        room: room.getSummary(),
        roomCode
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
   * @param {string} playerId - Socket ID of the player
   * @param {string} roomCode - Room code to join
   * @param {Object} playerData - Player information
   * @returns {Object} Join result or error
   */
  joinRoom(playerId, roomCode, playerData = {}) {
    try {
      // Validate room code format
      if (!isValidRoomCode(roomCode)) {
        return {
          success: false,
          error: 'Invalid room code format'
        };
      }

      // Check if player is already in a room
      if (this.playerToRoom.has(playerId)) {
        return {
          success: false,
          error: 'Player is already in a room',
          roomCode: this.playerToRoom.get(playerId)
        };
      }

      // Check if room exists
      const room = this.rooms.get(roomCode);
      if (!room) {
        return {
          success: false,
          error: 'Room not found'
        };
      }

      // Check if room is full
      if (room.isFull()) {
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
      if (!room.addPlayer(playerId, playerData)) {
        return {
          success: false,
          error: 'Failed to join room'
        };
      }

      // Update player mapping
      this.playerToRoom.set(playerId, roomCode);

      return {
        success: true,
        room: room.getSummary(),
        roomCode
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
   * @param {string} playerId - Socket ID of the player
   * @returns {Object} Leave result
   */
  leaveRoom(playerId) {
    try {
      const roomCode = this.playerToRoom.get(playerId);
      if (!roomCode) {
        return {
          success: false,
          error: 'Player is not in any room'
        };
      }

      const room = this.rooms.get(roomCode);
      if (!room) {
        // Clean up orphaned player mapping
        this.playerToRoom.delete(playerId);
        return {
          success: false,
          error: 'Room not found'
        };
      }

      const wasHost = room.hostId === playerId;
      const removed = room.removePlayer(playerId);
      
      if (!removed) {
        return {
          success: false,
          error: 'Failed to remove player from room'
        };
      }

      // Remove player mapping
      this.playerToRoom.delete(playerId);

      // If room is empty, delete it
      if (room.isEmpty()) {
        this.rooms.delete(roomCode);
        return {
          success: true,
          roomDeleted: true,
          message: 'Left room and room was deleted'
        };
      }

      // If host left, assign new host
      if (wasHost) {
        const players = room.getAllPlayers();
        if (players.length > 0) {
          room.hostId = players[0].id;
        }
      }

      return {
        success: true,
        room: room.getSummary(),
        wasHost,
        newHost: wasHost ? room.hostId : null
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
  getRoom(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return {
        success: false,
        error: 'Room not found'
      };
    }

    return {
      success: true,
      room: room.getSummary()
    };
  }

  /**
   * Get player's current room
   * @param {string} playerId - Socket ID of the player
   * @returns {Object} Room data or error
   */
  getPlayerRoom(playerId) {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) {
      return {
        success: false,
        error: 'Player is not in any room'
      };
    }

    return this.getRoom(roomCode);
  }

  /**
   * Update player ready status
   * @param {string} playerId - Socket ID of the player
   * @param {boolean} isReady - Ready status
   * @returns {Object} Update result
   */
  setPlayerReady(playerId, isReady) {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) {
      return {
        success: false,
        error: 'Player is not in any room'
      };
    }

    const room = this.rooms.get(roomCode);
    if (!room) {
      return {
        success: false,
        error: 'Room not found'
      };
    }

    const updated = room.setPlayerReady(playerId, isReady);
    if (!updated) {
      return {
        success: false,
        error: 'Failed to update player ready status'
      };
    }

    return {
      success: true,
      room: room.getSummary(),
      allReady: room.allPlayersReady()
    };
  }

  /**
   * Get all active rooms
   * @returns {Array} Array of room summaries
   */
  getAllRooms() {
    return Array.from(this.rooms.values()).map(room => room.getSummary());
  }

  /**
   * Clean up empty rooms
   * @returns {number} Number of rooms cleaned up
   */
  cleanupEmptyRooms() {
    let cleaned = 0;
    for (const [roomCode, room] of this.rooms.entries()) {
      if (room.isEmpty()) {
        this.rooms.delete(roomCode);
        cleaned++;
      }
    }
    return cleaned;
  }

  /**
   * Get room statistics
   * @returns {Object} Room statistics
   */
  getStats() {
    return {
      totalRooms: this.rooms.size,
      totalPlayers: this.playerToRoom.size,
      roomsByState: {
        waiting: Array.from(this.rooms.values()).filter(r => r.gameState === 'waiting').length,
        playing: Array.from(this.rooms.values()).filter(r => r.gameState === 'playing').length,
        finished: Array.from(this.rooms.values()).filter(r => r.gameState === 'finished').length
      }
    };
  }
}

module.exports = RoomService;
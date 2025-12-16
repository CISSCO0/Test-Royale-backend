// controllers/roomController.js
const RoomService = require('../services/roomService');
const roomService = new RoomService();

class RoomController {
  
  // POST /api/rooms/create
  async createRoom(req, res) {
    try {
      const hostId = req.playerId; // assuming authMiddleware sets req.user
      const options = req.body || {};
      const result = await roomService.createRoom(hostId, options);
      if (!result.success) {
        return res.status(400).json({ error: result.error, roomCode: result.roomCode });
      }
      return res.status(201).json(result.room);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST /api/rooms/join
  async joinRoom(req, res) {
    try {
      const playerId = req.user.id; // from authMiddleware
      const { roomCode, name } = req.body;
      const result = await roomService.joinRoom(playerId, roomCode, { name });
      if (!result.success) {
        return res.status(400).json({ error: result.error, roomCode: result.roomCode });
      }
      return res.status(200).json(result.room);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Optional: GET /api/rooms/:code
  async getRoom(req, res) {
    try {
      const { code } = req.params;
      const activeRoom = roomService.activeRooms.get(code);
      if (!activeRoom) {
        return res.status(404).json({ error: 'Room not found' });
      }
      return res.status(200).json(activeRoom);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  // POST /api/rooms/leave
  async leaveRoom(req, res) {
    try {
      const playerId = req.user.id;
      const result = await roomService.leaveRoom(playerId);
      if (!result.success) return res.status(400).json({ error: result.error });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }


  // GET /api/rooms/player
  async getPlayerRoom(req, res) {
    try {
      const playerId = req.user.id;
      const result = await roomService.getPlayerRoom(playerId);
      if (!result.success) return res.status(404).json({ error: result.error });
      return res.status(200).json(result.room);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST /api/rooms/ready
  async setPlayerReady(req, res) {
    try {
      const playerId = req.user.id;
      const { isReady } = req.body;
      const result = await roomService.setPlayerReady(playerId, isReady);
      if (!result.success) return res.status(400).json({ error: result.error });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  // POST /api/rooms/update-state
  async updateRoomGameState(req, res) {
    try {
      const { roomCode, gameState, gameData } = req.body;
      const result = await roomService.updateRoomGameState(roomCode, gameState, gameData);
      if (!result.success) return res.status(404).json({ error: result.error });
      return res.status(200).json(result.room);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /api/rooms
  async getAllRooms(req, res) {
    try {
      const options = req.query; // e.g., ?limit=10&gameState=waiting
      const result = await roomService.getAllRooms(options);
      if (!result.success) return res.status(500).json({ error: result.error });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST /api/rooms/cleanup
  async cleanupEmptyRooms(req, res) {
    try {
      const result = await roomService.cleanupEmptyRooms();
      if (!result.success) return res.status(500).json({ error: result.error });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /api/rooms/stats
  async getRoomStats(req, res) {
    try {
      const result = await roomService.getRoomStats();
      if (!result.success) return res.status(500).json({ error: result.error });
      return res.status(200).json(result.stats);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET /api/rooms/active
  async getActiveRooms(req, res) {
    try {
      const rooms = roomService.getActiveRooms();
      return res.status(200).json({ success: true, rooms });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST /api/rooms/clear-memory
  async clearRoomFromMemory(req, res) {
    try {
      const { roomCode } = req.body;
      roomService.clearRoomFromMemory(roomCode);
      return res.status(200).json({ success: true, message: `Room ${roomCode} cleared from memory` });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new RoomController();

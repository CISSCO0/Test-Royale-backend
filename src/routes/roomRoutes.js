// routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create', authMiddleware, roomController.createRoom.bind(roomController));
router.post('/join', authMiddleware, roomController.joinRoom.bind(roomController));
router.post('/leave', authMiddleware, roomController.leaveRoom.bind(roomController));
router.get('/:code', authMiddleware, roomController.getRoom.bind(roomController));
router.get('/player/current', authMiddleware, roomController.getPlayerRoom.bind(roomController));
router.post('/ready', authMiddleware, roomController.setPlayerReady.bind(roomController));
router.post('/update-state', authMiddleware, roomController.updateRoomGameState.bind(roomController));
router.get('/', authMiddleware, roomController.getAllRooms.bind(roomController));
router.post('/cleanup', authMiddleware, roomController.cleanupEmptyRooms.bind(roomController));
router.get('/stats', authMiddleware, roomController.getRoomStats.bind(roomController));
router.get('/active', authMiddleware, roomController.getActiveRooms.bind(roomController));
router.post('/clear-memory', authMiddleware, roomController.clearRoomFromMemory.bind(roomController));

module.exports = router;

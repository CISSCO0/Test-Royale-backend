const express = require('express');
const router = express.Router();
const GameController = require('../controllers/gameController');

const gameController = new GameController();

router.post("/submitTestCode",gameController.submitTestCode);
router.get("/:gameId",gameController.getGame);
router.get("/:playerId/:gameId/lastSubmission",gameController.getLastSubmission);
router.post("/calculate-player-data", gameController.calculatePlayerData);

module.exports = router;
const GameService = require('../services/gameService');
const gameService = new GameService();
class GameController {
/**
 * GET /api/game/:gameId
 * @param {object} req 
 * @param {object} res 
 * @returns 
 */
 getGame = async (req,res) => {
  try {
    const { gameId } = req.params;
    if (!gameId) {
      return res.status(400).json({ success: false, error: 'Missing gameId' });
    }
    const result = await gameService.getGame(gameId);
    res.json(result);

  }catch (err) {
    console.error("Error in getGame controller", err);
    res.status(500).json({ error: err.message });
  }

 }

/**
 * Post /api/game/submitTestCode 
 * Submit a player's test code for a game
 * @param {Object} req - Express request object
 * @param {Object} req.body.gameId - ID of the game
 * @param {Object} req.body.playerId - ID of the player
 * @param {string} req.body.testCode - Player's test code
 * @param {Object} res - Express response object
 */

submitTestCode = async (req, res) => {
  try {
  const { gameId, playerId, testCode } = req.body;
  console.log(" test code received in controller:", testCode);
  if (!gameId || !playerId || !testCode) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }
  const result = await gameService.submitTestCode(gameId, playerId, testCode);
  res.json(result);
}catch (err){
 res.status(500).json({ error: err.message });
}
};

/**
 * get /api/game/:playerId/:gameId/lastSubmission
 * @param {object} req 
 * @param {object} res //last submission of a player in a game
 * @param {object} req.params.gameId 
 * @param {object} req.params.playerId
 * @returns 
 */

getLastSubmission = async (req, res) => {
  try {
    const { playerId,gameId} = req.params;
    if (!playerId || !gameId) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
    const result = await gameService.getLastSubmission(playerId,gameId);
    res.json(result);
  }
catch (err) { 
    console.error("Error in getLastSubmission:", err);
}
}


calculatePlayerData = async (req, res) => {
  try {
    const { gameId, playerId } = req.body;
    if (!gameId || !playerId) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
  
    const result = await gameService.calculatePlayerData(gameId, playerId);
    console.log( "results  finale" + JSON.stringify(result) )
    res.json(result);

  } catch (err) {
    console.error("Error in calculatePlayerData:", err);
    res.status(500).json({ error: err.message });
  }
}


}

module.exports = GameController;
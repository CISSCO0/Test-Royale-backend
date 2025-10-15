const mongoose = require('mongoose');
const { Schema } = mongoose;

const gameSchema = new Schema({
  roomCode: { type: String, required: true },
  codeId: { type: Schema.Types.ObjectId, ref: 'Code', required: true },
  players: [{
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    playerCode: { type: String, required: true }, // test code the player wrote
    score: { type: Number, default: 0 },
    coverageScore: { type: Number, default: 0 },
    mutationScore: { type: Number, default: 0 },
    redundancyPenalty: { type: Number, default: 0 },
    badgesEarned: [{ type: Schema.Types.ObjectId, ref: 'Badge' }],
    feedback: { type: String, default: '' },
    gameDuration: { type: Number, default: 0 }, // in seconds
    submittedAt: { type: Date, default: Date.now }
  }],
  gameState: { 
    type: String, 
    enum: ['waiting', 'playing', 'finished'], 
    default: 'waiting' 
  },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },
  winner: { type: Schema.Types.ObjectId, ref: 'Player' },
  totalDuration: { type: Number, default: 0 } // in seconds
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);
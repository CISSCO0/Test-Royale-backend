const mongoose = require('mongoose');
const { Schema } = mongoose;

const gameSchema = new Schema({
  roomCode: { type: String, required: true },
  codeId: { type: Schema.Types.ObjectId, ref: 'Code', required: true },

  players: [{
    playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
    submission: {
      testCode: { type: String, default: ''  },
      submittedAt: { type: Date, default: Date.now },
      stats : {type:Object}
    },
    totalScore: { type: Number, default: 0 },
    branchCoverage: { type: Number, default: 0 },
    lineCoverage: { type : Array, default: [] },
    lineRate: { type: Number, default: 0 },
    coverageSummary: { type: Number, default: 0 },
    mutation: {
      score: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      killed: { type: Number, default: 0 },
      survived: { type: Number, default: 0 },
      timeout: { type: Number, default: 0 },
      noCoverage: { type: Number, default: 0 },
     details: [
  {
    mutantId: String,
    status: {
      type: String,
enum: [
    'Killed',
    'Survived',
    'NoCoverage',
    'Timeout',
    'RuntimeError',
    'CompileError',
    'Ignored',
    'Pending'
  ]
    }
  }
]

  },
    badgesEarned: [{ type: Schema.Types.ObjectId, ref: 'Badge' }],
    testLines: { type: Number, default: 0 },
    executionTime:  {type: Number, default: 0 },
    feedback: { type: String, default: '' },
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



const mongoose = require('mongoose');
const { Schema } = mongoose;
const playerInRoomSchema = require('./playerInRoom');
const roomSchema = new Schema({

  code: { type: String, required: true, unique: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  maxPlayers: { type: Number, default: 4 },
  players: [playerInRoomSchema],
  gameState: { type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' },
  gameData: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);

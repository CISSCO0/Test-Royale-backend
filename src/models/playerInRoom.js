const mongoose = require('mongoose');
const { Schema } = mongoose;

const playerInRoomSchema = new Schema({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  name: { type: String, required: true },
  isReady: { type: Boolean, default: false },
  isHost: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now }
});


module.exports = playerInRoomSchema;
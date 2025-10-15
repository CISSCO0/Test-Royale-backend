const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Achievement', achievementSchema);
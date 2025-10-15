const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    required: false
  },
  icon: {
    type: String,
    default: '🏆'
  }
});

module.exports = mongoose.model('Badge', badgeSchema);
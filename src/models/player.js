const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isEmail } = require('validator');

const playerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, validate: [isEmail, 'Invalid email'] },
  password: { type: String, required: true, minlength: 6 },
  name: { type: String, default: 'Unknown Player' },
  totalScore: { type: Number, default: 0 },
  totalGamesPlayed: { type: Number, default: 0 },
  totalGamesWon:{ type: Number, default: 0 },
  winRate: { type: Number, default: 0 } ,
  averageScore:{ type: Number, default: 0 },
  
  bestScore:{ type: Number, default: 0 },
  badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }

  ],
  achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
  joinedAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Password hashing
playerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

playerSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Player', playerSchema);

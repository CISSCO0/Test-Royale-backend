const mongoose = require('mongoose');
const { Schema } = mongoose;
const codeSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  language: { type: String, enum: ['python', 'java', 'csharp'], required: true },
  baseCode: { type: String, required: true },  // code players test against
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Code', codeSchema);
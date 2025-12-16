const mongoose = require('mongoose');
const { Schema } = mongoose;

const codeSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  baseCode: { type: String, required: true },  // code students write
  testTemplate: { type: String },              // starter code for students to write tests
  createdAt: { type: Date, default: Date.now },
  time : {type: Number ,default: 1000 }
});

module.exports = mongoose.model('Code', codeSchema);


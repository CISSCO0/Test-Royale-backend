const mongoose = require('mongoose');
const { config, validateConfig } = require('./env');

async function connectDB() {
  try {
    await mongoose.connect(config.database.url, config.database.options);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

module.exports = connectDB;


/**
 * Utility functions for generating random room codes
 */

/**
 * Generates a random room code of specified length
 * @param {number} length - Length of the room code (default: 6)
 * @returns {string} Random room code
 */
function generateRoomCode(length = 6) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Generates a unique room code that doesn't exist in the provided rooms
 * @param {Map|Object} existingRooms - Map or object containing existing rooms
 * @param {number} length - Length of the room code (default: 6)
 * @returns {string} Unique room code
 */
function generateUniqueRoomCode(existingRooms, length = 6) {
  let code;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = generateRoomCode(length);
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique room code after maximum attempts');
    }
  } while (existingRooms.has ? existingRooms.has(code) : existingRooms[code]);
  
  return code;
}

/**
 * Validates if a room code format is correct
 * @param {string} code - Room code to validate
 * @param {number} expectedLength - Expected length of the code (default: 6)
 * @returns {boolean} True if valid, false otherwise
 */
function isValidRoomCode(code, expectedLength = 6) {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  if (code.length !== expectedLength) {
    return false;
  }
  
  // Check if code contains only alphanumeric characters
  const alphanumericRegex = /^[A-Z0-9]+$/;
  return alphanumericRegex.test(code);
}

module.exports = {
  generateRoomCode,
  generateUniqueRoomCode,
  isValidRoomCode
};
const {
  codeService,
  achievementService,
  badgeService
} = require('./index');

/**
 * Initialize all services with default data
 * @returns {Object} Initialization result
 */
async function initializeServices() {
  try {
    console.log('🚀 Initializing services...');

    const results = {
      codeService: null,
      achievementService: null,
      badgeService: null,
      errors: []
    };

    // Initialize code challenges
    try {
      console.log('📝 Initializing code challenges...');
      results.codeService = await codeService.initializeDefaultChallenges();
      console.log('✅ Code challenges initialized');
    } catch (error) {
      console.error('❌ Error initializing code challenges:', error.message);
      results.errors.push({ service: 'codeService', error: error.message });
    }

    // Initialize achievements
    try {
      console.log('🏆 Initializing achievements...');
      results.achievementService = await achievementService.initializeDefaultAchievements();
      console.log('✅ Achievements initialized');
    } catch (error) {
      console.error('❌ Error initializing achievements:', error.message);
      results.errors.push({ service: 'achievementService', error: error.message });
    }

    // Initialize badges
    try {
      console.log('🎖️ Initializing badges...');
      results.badgeService = await badgeService.initializeDefaultBadges();
      console.log('✅ Badges initialized');
    } catch (error) {
      console.error('❌ Error initializing badges:', error.message);
      results.errors.push({ service: 'badgeService', error: error.message });
    }

    const success = results.errors.length === 0;
    
    if (success) {
      console.log('🎉 All services initialized successfully!');
    } else {
      console.log('⚠️ Some services failed to initialize');
    }

    return {
      success,
      results,
      message: success ? 'All services initialized successfully' : 'Some services failed to initialize'
    };
  } catch (error) {
    console.error('💥 Fatal error during service initialization:', error);
    return {
      success: false,
      error: error.message,
      message: 'Fatal error during service initialization'
    };
  }
}

/**
 * Check if services are properly initialized
 * @returns {Object} Service status
 */
async function checkServiceStatus() {
  try {
    const status = {
      codeService: false,
      achievementService: false,
      badgeService: false,
      errors: []
    };

    // Check code service
    try {
      const codeStats = await codeService.getChallengeStats();
      status.codeService = codeStats.success && codeStats.stats.totalChallenges > 0;
    } catch (error) {
      status.errors.push({ service: 'codeService', error: error.message });
    }

    // Check achievement service
    try {
      const achievementStats = await achievementService.getAchievementStats();
      status.achievementService = achievementStats.success && achievementStats.stats.totalAchievements > 0;
    } catch (error) {
      status.errors.push({ service: 'achievementService', error: error.message });
    }

    // Check badge service
    try {
      const badgeStats = await badgeService.getBadgeStats();
      status.badgeService = badgeStats.success && badgeStats.stats.totalBadges > 0;
    } catch (error) {
      status.errors.push({ service: 'badgeService', error: error.message });
    }

    const allInitialized = status.codeService && status.achievementService && status.badgeService;

    return {
      success: allInitialized,
      status,
      message: allInitialized ? 'All services are properly initialized' : 'Some services need initialization'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Error checking service status'
    };
  }
}

/**
 * Reset all services (clear all data)
 * @returns {Object} Reset result
 */
async function resetServices() {
  try {
    console.log('🔄 Resetting all services...');

    const results = {
      codeService: null,
      achievementService: null,
      badgeService: null,
      errors: []
    };

    // Reset code challenges
    try {
      console.log('🗑️ Resetting code challenges...');
      const Code = require('../models/code');
      await Code.deleteMany({});
      results.codeService = { message: 'Code challenges reset' };
      console.log('✅ Code challenges reset');
    } catch (error) {
      console.error('❌ Error resetting code challenges:', error.message);
      results.errors.push({ service: 'codeService', error: error.message });
    }

    // Reset achievements
    try {
      console.log('🗑️ Resetting achievements...');
      const Achievement = require('../models/achievement');
      await Achievement.deleteMany({});
      results.achievementService = { message: 'Achievements reset' };
      console.log('✅ Achievements reset');
    } catch (error) {
      console.error('❌ Error resetting achievements:', error.message);
      results.errors.push({ service: 'achievementService', error: error.message });
    }

    // Reset badges
    try {
      console.log('🗑️ Resetting badges...');
      const Badge = require('../models/badge');
      await Badge.deleteMany({});
      results.badgeService = { message: 'Badges reset' };
      console.log('✅ Badges reset');
    } catch (error) {
      console.error('❌ Error resetting badges:', error.message);
      results.errors.push({ service: 'badgeService', error: error.message });
    }

    const success = results.errors.length === 0;
    
    if (success) {
      console.log('🎉 All services reset successfully!');
    } else {
      console.log('⚠️ Some services failed to reset');
    }

    return {
      success,
      results,
      message: success ? 'All services reset successfully' : 'Some services failed to reset'
    };
  } catch (error) {
    console.error('💥 Fatal error during service reset:', error);
    return {
      success: false,
      error: error.message,
      message: 'Fatal error during service reset'
    };
  }
}

module.exports = {
  initializeServices,
  checkServiceStatus,
  resetServices
};
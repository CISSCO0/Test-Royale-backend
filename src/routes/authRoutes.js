const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // this is already an instance
const authMiddleware = require('../middleware/authMiddleware');

// Direct registration without email verification
router.post('/register', authController.register.bind(authController));

// Legacy email verification routes (kept for backward compatibility)
router.post('/start-registration', authController.startRegistration.bind(authController));
router.post('/verify-registration', authController.verifyRegistration.bind(authController));

router.post('/login', authController.login.bind(authController));
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));
router.post('/logout', authMiddleware, authController.logout.bind(authController));

router.get('/getPlayer/:playerId', authMiddleware, authController.getPlayer.bind(authController));
module.exports = router;

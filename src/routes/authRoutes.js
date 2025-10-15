const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // this is already an instance
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));
router.post('/logout', authMiddleware, authController.logout.bind(authController));
module.exports = router;

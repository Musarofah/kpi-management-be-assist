const express = require('express');
const router = express.Router();
const { register, login, googleLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Rate limiting diterapkan untuk endpoint registrasi dan login
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);
router.get('/me', protect, getMe);

module.exports = router;
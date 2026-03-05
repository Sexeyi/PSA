const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controller/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route
router.get('/me', auth, getCurrentUser);

module.exports = router;
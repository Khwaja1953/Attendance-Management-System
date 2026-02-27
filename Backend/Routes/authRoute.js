const express = require('express');
const router = express.Router();
const { signup, login, getMe } = require('../Controllers/authController');
const { verifyToken } = require('../Middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', verifyToken, getMe);

module.exports = router;

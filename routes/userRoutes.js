const express = require('express');
const { register, login, getProfile, updateProfile, upload } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, upload.single('profileImage'), updateProfile);

module.exports = router;

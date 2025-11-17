const express = require('express');
const { createReview, getWorkerReviews, updateReview, deleteReview } = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.post('/', authenticateToken, createReview);
router.get('/worker/:workerId', authenticateToken, getWorkerReviews);
router.put('/:reviewId', authenticateToken, updateReview);
router.delete('/:reviewId', authenticateToken, deleteReview);

module.exports = router;

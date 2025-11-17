const express = require('express');
const { createBooking, getBookings, updateBookingStatus, getAvailableWorkers, createReview, getWorkerReviews } = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.post('/', authenticateToken, createBooking);
router.get('/', authenticateToken, getBookings);
router.put('/:bookingId/status', authenticateToken, updateBookingStatus);
router.get('/available', authenticateToken, getAvailableWorkers);
router.post('/reviews', authenticateToken, createReview);
router.get('/workers/:workerId/reviews', getWorkerReviews);

module.exports = router;

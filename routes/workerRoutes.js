const express = require('express');
const {
  getWorkers,
  getWorkerById,
  updateWorkerProfile,
  getWorkerStats
} = require('../controllers/workerController');
const { authenticateToken, requireWorker } = require('../middleware/auth');

const router = express.Router();

// Routes
router.get('/', getWorkers);
router.get('/:id', getWorkerById);
router.put('/profile', authenticateToken, requireWorker, updateWorkerProfile);
router.get('/stats/me', authenticateToken, requireWorker, getWorkerStats);

module.exports = router;

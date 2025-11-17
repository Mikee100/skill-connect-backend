const express = require('express');
const { addPortfolioItem, getPortfolio, updatePortfolioItem, deletePortfolioItem } = require('../controllers/portfolioController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.post('/', authenticateToken, addPortfolioItem);
router.get('/worker/:workerId', authenticateToken, getPortfolio);
router.put('/:itemId', authenticateToken, updatePortfolioItem);
router.delete('/:itemId', authenticateToken, deletePortfolioItem);

module.exports = router;

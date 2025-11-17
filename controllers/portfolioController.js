const { PortfolioItem, User } = require('../models');

const addPortfolioItem = async (req, res) => {
  try {
    const { image, title, description } = req.body;
    const workerId = req.user.userId;

    // Verify user is a worker
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can add portfolio items' });
    }

    // Create portfolio item
    const portfolioItem = await PortfolioItem.create({
      workerId,
      image,
      title,
      description
    });

    res.status(201).json({
      message: 'Portfolio item added successfully',
      portfolioItem
    });
  } catch (error) {
    console.error('Add portfolio item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPortfolio = async (req, res) => {
  try {
    const { workerId } = req.params;

    const portfolio = await PortfolioItem.findAll({
      where: { workerId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ portfolio });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updatePortfolioItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { image, title, description } = req.body;
    const workerId = req.user.userId;

    // Find portfolio item
    const portfolioItem = await PortfolioItem.findOne({
      where: { id: itemId, workerId }
    });

    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    // Update portfolio item
    await portfolioItem.update({ image, title, description });

    res.json({ message: 'Portfolio item updated successfully' });
  } catch (error) {
    console.error('Update portfolio item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deletePortfolioItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const workerId = req.user.userId;

    // Find and delete portfolio item
    const portfolioItem = await PortfolioItem.findOne({
      where: { id: itemId, workerId }
    });

    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    await portfolioItem.destroy();

    res.json({ message: 'Portfolio item deleted successfully' });
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addPortfolioItem,
  getPortfolio,
  updatePortfolioItem,
  deletePortfolioItem
};

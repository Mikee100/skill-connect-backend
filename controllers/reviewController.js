const { Review, User, Worker } = require('../models');

const createReview = async (req, res) => {
  try {
    const { workerId, rating, comment } = req.body;
    const clientId = req.user.userId;

    // Check if booking exists and is completed
    const booking = await require('../models').Booking.findOne({
      where: {
        workerId,
        clientId,
        status: 'completed'
      }
    });

    if (!booking) {
      return res.status(400).json({ message: 'Cannot review without completed booking' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      where: { workerId, clientId }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists' });
    }

    // Create review
    const review = await Review.create({
      workerId,
      clientId,
      rating,
      comment
    });

    // Update worker rating
    const workerReviews = await Review.findAll({ where: { workerId } });
    const averageRating = workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length;

    await Worker.update(
      { rating: averageRating, reviewCount: workerReviews.length },
      { where: { userId: workerId } }
    );

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getWorkerReviews = async (req, res) => {
  try {
    const { workerId } = req.params;

    const reviews = await Review.findAll({
      where: { workerId },
      include: [
        { model: User, as: 'client', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Get worker reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const clientId = req.user.userId;

    // Find review
    const review = await Review.findOne({
      where: { id: reviewId, clientId }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Update review
    await review.update({ rating, comment });

    // Update worker rating
    const workerId = review.workerId;
    const workerReviews = await Review.findAll({ where: { workerId } });
    const averageRating = workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length;

    await Worker.update(
      { rating: averageRating },
      { where: { userId: workerId } }
    );

    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const clientId = req.user.userId;

    // Find and delete review
    const review = await Review.findOne({
      where: { id: reviewId, clientId }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.destroy();

    // Update worker rating
    const workerId = review.workerId;
    const workerReviews = await Review.findAll({ where: { workerId } });
    const averageRating = workerReviews.length > 0
      ? workerReviews.reduce((sum, r) => sum + r.rating, 0) / workerReviews.length
      : 0;

    await Worker.update(
      { rating: averageRating, reviewCount: workerReviews.length },
      { where: { userId: workerId } }
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createReview,
  getWorkerReviews,
  updateReview,
  deleteReview
};

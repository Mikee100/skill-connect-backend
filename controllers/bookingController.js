const { Booking, User, Worker, Review, Client } = require('../models');

const createBooking = async (req, res) => {
  try {
    const { workerId, scheduledDate, scheduledTime, description, service } = req.body;
    const clientId = req.user.userId;

    // Verify worker exists and is available
    const worker = await Worker.findOne({
      where: { userId: workerId },
      include: [{ model: User, as: 'user' }]
    });

    if (!worker || !worker.availability) {
      return res.status(400).json({ message: 'Worker not available' });
    }

    // Get client profile
    const client = await Client.findOne({ where: { userId: clientId } });
    if (!client) {
      return res.status(400).json({ message: 'Client profile not found' });
    }

    // Create booking
    const booking = await Booking.create({
      workerId: worker.id,
      clientId: client.id,
      scheduledDate,
      scheduledTime,
      description,
      service
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { status, dateFrom, dateTo, service, clientName } = req.query;

    let whereCondition = {};
    if (role === 'worker') {
      // For workers, find their Worker profile first
      const workerProfile = await Worker.findOne({ where: { userId } });
      if (workerProfile) {
        whereCondition.workerId = workerProfile.id;
      }
    } else {
      // For clients, find their Client profile first
      const clientProfile = await Client.findOne({ where: { userId } });
      if (clientProfile) {
        whereCondition.clientId = clientProfile.id;
      }
    }

    // Add filters
    if (status) {
      whereCondition.status = status;
    }
    if (dateFrom && dateTo) {
      whereCondition.scheduledDate = {
        [require('sequelize').Op.between]: [dateFrom, dateTo]
      };
    } else if (dateFrom) {
      whereCondition.scheduledDate = {
        [require('sequelize').Op.gte]: dateFrom
      };
    } else if (dateTo) {
      whereCondition.scheduledDate = {
        [require('sequelize').Op.lte]: dateTo
      };
    }
    if (service) {
      whereCondition.service = {
        [require('sequelize').Op.iLike]: `%${service}%`
      };
    }

    let includeOptions = [
      {
        model: Worker,
        as: 'worker',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'county', 'town', 'area', 'profileImage']
        }]
      },
      {
        model: Client,
        as: 'client',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'county', 'town', 'area', 'profileImage']
        }]
      }
    ];

    // Add client name filter if provided
    if (clientName && role === 'worker') {
      includeOptions[1].include[0].where = {
        name: {
          [require('sequelize').Op.iLike]: `%${clientName}%`
        }
      };
    }

    const bookings = await Booking.findAll({
      where: whereCondition,
      include: includeOptions,
      order: [['createdAt', 'DESC']]
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    // Find booking
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check permissions
    let hasPermission = false;
    if (role === 'worker') {
      const workerProfile = await Worker.findOne({ where: { userId } });
      if (workerProfile && booking.workerId === workerProfile.id) {
        hasPermission = true;
      }
    } else {
      const clientProfile = await Client.findOne({ where: { userId } });
      if (clientProfile && booking.clientId === clientProfile.id) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // If marking as completed, increment worker's completed jobs count
    if (status === 'completed' && booking.status !== 'completed') {
      const worker = await Worker.findOne({ where: { id: booking.workerId } });
      if (worker) {
        await worker.increment('completedJobs', { by: 1 });
      }
    }

    // Update status
    await booking.update({ status });

    res.json({ message: 'Booking status updated successfully' });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAvailableWorkers = async (req, res) => {
  try {
    const { skills, location } = req.query;

    let whereCondition = { availability: true };

    if (skills) {
      const skillArray = skills.split(',');
      whereCondition.skills = {
        [require('sequelize').Op.overlap]: skillArray
      };
    }

    const workers = await Worker.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'user',
          ...(location && {
            where: {
              [require('sequelize').Op.or]: [
                { county: location },
                { town: location },
                { area: location }
              ]
            }
          }),
          attributes: ['id', 'name', 'email', 'phone', 'county', 'town', 'area', 'profileImage']
        }
      ],
      attributes: ['skills', 'expertise', 'bio', 'rating', 'reviewCount', 'hourlyRate', 'completedJobs']
    });

    res.json({ workers });
  } catch (error) {
    console.error('Get available workers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const reviewerId = req.user.userId;

    // Find booking
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    // Check if reviewer is the client
    const clientProfile = await Client.findOne({ where: { userId: reviewerId } });
    if (!clientProfile || booking.clientId !== clientProfile.id) {
      return res.status(403).json({ message: 'Only clients can review workers' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ where: { bookingId } });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this booking' });
    }

    // Get the worker's user ID
    const worker = await Worker.findOne({ where: { id: booking.workerId } });
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Create review
    const review = await Review.create({
      bookingId,
      reviewerId,
      revieweeId: worker.userId,
      rating,
      comment
    });

    // Update worker's rating and review count
    const allReviews = await Review.findAll({
      where: { revieweeId: worker.userId },
      attributes: ['rating']
    });

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const newRating = totalRating / allReviews.length;
    const newReviewCount = allReviews.length;

    await worker.update({
      rating: newRating,
      reviewCount: newReviewCount
    });

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
      where: { revieweeId: workerId },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'profileImage']
        },
        {
          model: Booking,
          as: 'booking',
          attributes: ['service']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Get worker reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBooking,
  getBookings,
  updateBookingStatus,
  getAvailableWorkers,
  createReview,
  getWorkerReviews
};

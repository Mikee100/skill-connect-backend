const { Worker, User, Skill, Booking } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Get all workers with filters
const getWorkers = async (req, res) => {
  try {
    const {
      skills,
      location,
      minRating,
      maxPrice,
      availability,
      searchQuery,
      page = 1,
      limit = 10
    } = req.query;

    let whereCondition = {};

    // Filter by availability
    if (availability !== undefined) {
      whereCondition.availability = availability === 'true';
    }

    // Filter by skills
    if (skills) {
      const skillArray = skills.split(',');
      whereCondition[Op.and] = skillArray.map(skill => Sequelize.literal(`JSON_CONTAINS(skills, '"${skill}"')`));
    }

    // Filter by rating
    if (minRating) {
      whereCondition.rating = {
        ...whereCondition.rating,
        [Op.gte]: parseFloat(minRating)
      };
    }

    // Filter by price
    if (maxPrice) {
      whereCondition.hourlyRate = {
        ...whereCondition.hourlyRate,
        [Op.lte]: parseFloat(maxPrice)
      };
    }

    // Search query
    let userWhereCondition = {};
    if (searchQuery) {
      userWhereCondition = {
        [Op.or]: [
          Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('name')), { [Op.like]: `%${searchQuery.toLowerCase()}%` }),
          Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('Worker.bio')), { [Op.like]: `%${searchQuery.toLowerCase()}%` })
        ]
      };
    }

    // Location filter
    if (location) {
      const locationData = JSON.parse(location);
      if (locationData.county) {
        userWhereCondition.county = locationData.county;
      }
      if (locationData.town) {
        userWhereCondition.town = locationData.town;
      }
    }

    const offset = (page - 1) * limit;

    const { count, rows: workers } = await Worker.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'user',
          where: userWhereCondition,
          attributes: ['id', 'name', 'email', 'phone', 'county', 'town', 'area', 'profileImage']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['rating', 'DESC'], ['reviewCount', 'DESC']]
    });

    res.json({
      workers,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get worker by ID
const getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching worker with userId:', id);

    const worker = await Worker.findOne({
      where: { userId: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'county', 'town', 'area', 'profileImage', 'createdAt']
        }
      ]
    });

    console.log('Worker found:', worker ? 'Yes' : 'No');
    if (worker) {
      console.log('Worker data:', { id: worker.id, userId: worker.userId, user: worker.user });
    }

    if (!worker) {
      console.log('No worker found for userId:', id);
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json({ worker });
  } catch (error) {
    console.error('Get worker by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update worker profile
const updateWorkerProfile = async (req, res) => {
  try {
    const { skills, expertise, bio, hourlyRate, availability } = req.body;
    const workerId = req.user.userId;

    let worker = await Worker.findOne({ where: { userId: workerId } });
    if (!worker) {
      // Create worker profile if it doesn't exist
      worker = await Worker.create({
        userId: workerId,
        skills: skills || [],
        expertise: expertise ? expertise.toLowerCase() : 'beginner',
        bio: bio || '',
        hourlyRate: hourlyRate || null,
        availability: availability !== undefined ? availability : true
      });
    } else {
      await worker.update({
        skills: skills || worker.skills,
        expertise: expertise ? expertise.toLowerCase() : worker.expertise,
        bio: bio !== undefined ? bio : worker.bio,
        hourlyRate: hourlyRate !== undefined ? hourlyRate : worker.hourlyRate,
        availability: availability !== undefined ? availability : worker.availability
      });
    }

    res.json({ message: 'Worker profile updated successfully', worker });
  } catch (error) {
    console.error('Update worker profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get worker stats
const getWorkerStats = async (req, res) => {
  try {
    const workerId = req.user.userId;

    const worker = await Worker.findOne({
      where: { userId: workerId },
      include: [{ model: User, as: 'user' }]
    });
    if (!worker) {
      return res.status(404).json({ message: 'Worker profile not found' });
    }

    const averageHoursPerJob = 4; // This could be made configurable

    // Get current date info
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get completed bookings this month
    const thisMonthCompleted = await Booking.count({
      where: {
        workerId,
        status: 'completed',
        [require('sequelize').Op.and]: [
          require('sequelize').where(require('sequelize').fn('MONTH', require('sequelize').col('updatedAt')), currentMonth),
          require('sequelize').where(require('sequelize').fn('YEAR', require('sequelize').col('updatedAt')), currentYear)
        ]
      }
    });

    // Get completed bookings last month
    const lastMonthCompleted = await Booking.count({
      where: {
        workerId,
        status: 'completed',
        [require('sequelize').Op.and]: [
          require('sequelize').where(require('sequelize').fn('MONTH', require('sequelize').col('updatedAt')), lastMonth),
          require('sequelize').where(require('sequelize').fn('YEAR', require('sequelize').col('updatedAt')), lastMonthYear)
        ]
      }
    });

    // Calculate growth percentage
    let growthPercentage = 0;
    if (lastMonthCompleted > 0) {
      growthPercentage = Math.round(((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100);
    } else if (thisMonthCompleted > 0) {
      growthPercentage = 100; // If no jobs last month but has this month
    }

    // Calculate total earnings (all time)
    const totalEarnings = worker.hourlyRate ? worker.hourlyRate * worker.completedJobs * averageHoursPerJob : 0;

    // Calculate monthly earnings (this month)
    const monthlyEarnings = worker.hourlyRate ? worker.hourlyRate * thisMonthCompleted * averageHoursPerJob : 0;

    // Calculate profile completion
    const user = worker.user;
    let completionScore = 0;
    const totalFields = 5;

    // Profile image (20%)
    if (user.profileImage) completionScore += 1;

    // Bio (20%)
    if (worker.bio && worker.bio.trim().length > 0) completionScore += 1;

    // Skills (20%)
    if (worker.skills && worker.skills.length > 0) completionScore += 1;

    // Hourly rate (20%)
    if (worker.hourlyRate) completionScore += 1;

    // Location (county, town, area) (20%)
    if (user.county && user.town && user.area) completionScore += 1;

    const profileCompletion = Math.round((completionScore / totalFields) * 100);

    const stats = {
      completedJobs: worker.completedJobs,
      rating: worker.rating,
      earnings: totalEarnings,
      monthlyEarnings,
      reviewCount: worker.reviewCount,
      growthPercentage,
      availability: worker.availability,
      profileCompletion
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get worker stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getWorkers,
  getWorkerById,
  updateWorkerProfile,
  getWorkerStats
};

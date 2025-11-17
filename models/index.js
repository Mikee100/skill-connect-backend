const { sequelize } = require('../config/database');
const User = require('./User');
const Worker = require('./Worker');
const Client = require('./Client');
const Booking = require('./Booking');
const Review = require('./Review');
const PortfolioItem = require('./PortfolioItem');
const Skill = require('./Skill');

// Sync all models
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Worker,
  Client,
  Booking,
  Review,
  PortfolioItem,
  Skill,
  syncDatabase
};

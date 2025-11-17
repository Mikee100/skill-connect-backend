const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Worker = sequelize.define('Worker', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  skills: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  expertise: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'expert', 'master'),
    allowNull: false
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  hourlyRate: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  availability: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  completedJobs: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'workers',
  timestamps: true
});

// Associations
Worker.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Worker, { foreignKey: 'userId', as: 'workerProfile' });

module.exports = Worker;

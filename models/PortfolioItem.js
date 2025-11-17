const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const PortfolioItem = sequelize.define('PortfolioItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  workerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'portfolio_items',
  timestamps: true
});

// Define associations
PortfolioItem.belongsTo(User, { foreignKey: 'workerId', as: 'worker' });

module.exports = PortfolioItem;

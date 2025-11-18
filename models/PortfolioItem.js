const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Worker = require('./Worker');

const PortfolioItem = sequelize.define('PortfolioItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  workerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Worker,
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
PortfolioItem.belongsTo(Worker, { foreignKey: 'workerId', as: 'worker' });

module.exports = PortfolioItem;

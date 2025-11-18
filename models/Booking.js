const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Worker = require('./Worker');
const Client = require('./Client');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  workerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Worker,
      key: 'id'
    }
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Client,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed'),
    defaultValue: 'pending'
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  scheduledTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  service: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'bookings',
  timestamps: true
});

// Define associations
Booking.belongsTo(Worker, { foreignKey: 'workerId', as: 'worker' });
Booking.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

module.exports = Booking;

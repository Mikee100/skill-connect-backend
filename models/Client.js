const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Client = sequelize.define('Client', {
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
  bookingsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'clients',
  timestamps: true
});

// Associations
Client.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Client, { foreignKey: 'userId', as: 'clientProfile' });

module.exports = Client;

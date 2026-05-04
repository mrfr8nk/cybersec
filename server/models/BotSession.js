const mongoose = require('mongoose');

const botSessionSchema = new mongoose.Schema({
  number: { type: String, unique: true, required: true, trim: true },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  connectedAt: { type: Date },
  lastActive:  { type: Date, default: Date.now },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('BotSession', botSessionSchema);

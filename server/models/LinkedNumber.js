const mongoose = require('mongoose');

const linkedNumberSchema = new mongoose.Schema({
  number: {
    type: String,
    required: [true, 'Number is required'],
    trim: true
  },
  botName: {
    type: String,
    required: [true, 'Bot name is required'],
    trim: true,
    maxlength: [50, 'Bot name cannot exceed 50 characters']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LinkedNumber', linkedNumberSchema);

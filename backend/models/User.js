const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['performer', 'instructor'],
    default: 'performer'
  },
  genre: {
    type: String,
    default: 'Ballet'
  },
  skill_level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
    default: 'Beginner'
  },
  techniques_to_improve: [{
    type: String
  }],
  chatSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession'
  }],
  aiReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIReport'
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema); 
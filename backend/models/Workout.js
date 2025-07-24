const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  user: {
    type: String, // plain workout titles or descriptions
    required: true
  },
  workouts: [{
    type: String, // plain workout titles or descriptions
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Workout', workoutSchema);

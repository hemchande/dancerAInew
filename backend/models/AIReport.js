const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  }
});

const aiReportSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  videoUrl: {
    type: String,
    required: false
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  feedback: [feedbackSchema],
  overallScore: {
    type: Number,
    min: 0,
    max: 10
  },
  summary: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

aiReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AIReport', aiReportSchema); 
const express = require('express');
const router = express.Router();
const AIReport = require('../models/AIReport');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a new AI report
router.post('/', auth, async (req, res) => {
  try {
    const { videoUrl, title, description, feedback, overallScore, summary } = req.body;
    
    const report = new AIReport({
      userId: req.user.uid,
      videoUrl,
      title,
      description,
      feedback,
      overallScore,
      summary
    });

    await report.save();

    // Add report to user's aiReports array
    await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $push: { aiReports: report._id } }
    );

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating AI report:', error);
    res.status(500).json({ message: 'Error creating AI report' });
  }
});

// Get all AI reports for a user
router.get('/user/:uid', auth, async (req, res) => {
  try {
    const reports = await AIReport.find({ userId: req.params.uid })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching AI reports:', error);
    res.status(500).json({ message: 'Error fetching AI reports' });
  }
});

// Get a specific AI report
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await AIReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error('Error fetching AI report:', error);
    res.status(500).json({ message: 'Error fetching AI report' });
  }
});

// Update an AI report
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, feedback, overallScore, summary } = req.body;
    
    const report = await AIReport.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        feedback,
        overallScore,
        summary
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error updating AI report:', error);
    res.status(500).json({ message: 'Error updating AI report' });
  }
});

// Delete an AI report
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await AIReport.findByIdAndDelete(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Remove report from user's aiReports array
    await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $pull: { aiReports: report._id } }
    );

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI report:', error);
    res.status(500).json({ message: 'Error deleting AI report' });
  }
});

module.exports = router; 
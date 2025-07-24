const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');

router.post('/save-workout', async (req, res) => {
  const { userId, workoutRecommendation } = req.body;

  if (!userId || !workoutRecommendation) {
    return res.status(400).json({ error: 'Missing userId or workoutRecommendation' });
  }

  try {
    const updatedDoc = await Workout.findOneAndUpdate(
      { user: userId },
      { $push: { workouts: workoutRecommendation } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, data: updatedDoc });
  } catch (err) {
    console.error('Error saving workout:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

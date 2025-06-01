const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register new user - no auth required
router.post('/register', async (req, res) => {
  try {
    const { uid, email, name, role, genre, skill_level, techniques_to_improve } = req.body;

    // Check if user already exists
    let user = await User.findOne({ uid });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      uid,
      email,
      name,
      role,
      genre,
      skill_level,
      techniques_to_improve
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Get user profile - requires auth
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update user profile - requires auth
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, role, genre, skill_level, techniques_to_improve } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { name, role, genre, skill_level, techniques_to_improve },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Error updating user profile' });
  }
});

// Get all instructors - requires auth
router.get('/instructors', auth, async (req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' })
      .select('name email genre');
    res.json(instructors);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({ message: 'Error fetching instructors' });
  }
});

module.exports = router; 
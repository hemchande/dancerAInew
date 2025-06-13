const express = require('express');
const router = express.Router();
const ChatSession = require('../models/ChatSession');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all chat sessions for a user
router.get('/sessions', auth, async (req, res) => {
  try {
    let user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      // Create user if they don't exist
      user = new User({
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name || req.user.email.split('@')[0],
        role: 'performer',
        genre: 'Ballet',
        skill_level: 'Beginner',
        techniques_to_improve: []
      });
      await user.save();
    }

    const sessions = await ChatSession.find({ user: user._id })
      .sort({ updated_at: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ message: 'Error fetching chat sessions' });
  }
});

// Create a new chat session
router.post('/sessions', auth, async (req, res) => {
  try {
    let user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      // Create user if they don't exist
      user = new User({
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name || req.user.email.split('@')[0],
        role: 'performer',
        genre: 'Ballet',
        skill_level: 'Beginner',
        techniques_to_improve: []
      });
      await user.save();
    }

    const { title } = req.body;
    const session = new ChatSession({
      user: user._id,
      title: title || 'New Chat',
      messages: []
    });

    await session.save();
    
    // Add session to user's chatSessions array
    user.chatSessions.push(session._id);
    await user.save();

    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ message: 'Error creating chat session' });
  }
});

// Get a specific chat session
router.get('/sessions/:id', auth, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: user._id
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({ message: 'Error fetching chat session' });
  }
});

// Update a chat session (e.g., change title)
router.put('/sessions/:id', auth, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { title } = req.body;
    const session = await ChatSession.findOneAndUpdate(
      { _id: req.params.id, user: user._id },
      { title },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error updating chat session:', error);
    res.status(500).json({ message: 'Error updating chat session' });
  }
});

// Delete a chat session
router.delete('/sessions/:sessionId', auth, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const session = await ChatSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    if (session.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await ChatSession.findByIdAndDelete(req.params.sessionId);
    
    // Remove session from user's chatSessions array
    user.chatSessions = user.chatSessions.filter(id => id.toString() !== session._id.toString());
    await user.save();

    res.json({ message: 'Chat session deleted' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ message: 'Error deleting chat session' });
  }
});

// Add a message to a chat session
router.post('/sessions/:sessionId/messages', auth, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    console.log(user)
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const session = await ChatSession.findById(req.params.sessionId);
    console.log(session)
    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    if (session.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { role, content } = req.body;
    session.messages.push({ role, content });
    await session.save();
    res.json(session);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ message: 'Error adding message' });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const LinkedNumber = require('../models/LinkedNumber');

// GET /api/user/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = req.user;
    const linkedCount = await LinkedNumber.countDocuments({ ownerId: user._id });
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      subscriptionPlan: user.subscriptionPlan,
      banned: user.banned,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
      linkedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { username } = req.body;
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (existing) return res.status(409).json({ error: 'Username already taken.' });
      req.user.username = username;
    }
    await req.user.save({ validateBeforeSave: false });
    res.json({ message: 'Profile updated.', username: req.user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const total = await LinkedNumber.countDocuments({ ownerId: req.user._id });
    const active = await LinkedNumber.countDocuments({ ownerId: req.user._id, status: 'active' });
    const inactive = total - active;
    const plan = req.user.subscriptionPlan;
    const limit = plan === 'free' ? 5 : plan === 'pro' ? 25 : 999;
    res.json({ total, active, inactive, plan, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

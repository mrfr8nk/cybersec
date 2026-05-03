const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const LinkedNumber = require('../models/LinkedNumber');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalNumbers = await LinkedNumber.countDocuments();
    const bannedUsers = await User.countDocuments({ banned: true });
    const activeNumbers = await LinkedNumber.countDocuments({ status: 'active' });
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = await User.countDocuments({ lastActive: { $gte: fiveMinAgo } });
    const planBreakdown = await User.aggregate([
      { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } }
    ]);
    res.json({ totalUsers, totalNumbers, bannedUsers, activeNumbers, onlineUsers, planBreakdown });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await User.countDocuments(query);
    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/numbers
router.get('/numbers', async (req, res) => {
  try {
    const numbers = await LinkedNumber.find()
      .populate('ownerId', 'username email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(numbers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot ban admin.' });
    user.banned = !user.banned;
    await user.save({ validateBeforeSave: false });
    res.json({ message: `User ${user.banned ? 'banned' : 'unbanned'}.`, banned: user.banned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin.' });
    await LinkedNumber.deleteMany({ ownerId: user._id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User and their numbers deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/plan
router.put('/users/:id/plan', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['free', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { subscriptionPlan: plan },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: `Plan updated to ${plan}.`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

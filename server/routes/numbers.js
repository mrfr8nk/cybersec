const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const LinkedNumber = require('../models/LinkedNumber');

const FREE_LIMIT = 5;

// GET /api/numbers
router.get('/', protect, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { ownerId: req.user._id };
    if (search) {
      query.$or = [
        { number: { $regex: search, $options: 'i' } },
        { botName: { $regex: search, $options: 'i' } }
      ];
    }
    const numbers = await LinkedNumber.find(query).sort({ createdAt: -1 });
    res.json(numbers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/numbers
router.post('/', protect, async (req, res) => {
  try {
    const { number, botName } = req.body;
    if (!number || !botName) {
      return res.status(400).json({ error: 'Number and bot name are required.' });
    }
    const plan = req.user.subscriptionPlan;
    const limit = plan === 'free' ? FREE_LIMIT : plan === 'pro' ? 25 : 999;
    const count = await LinkedNumber.countDocuments({ ownerId: req.user._id });
    if (count >= limit) {
      return res.status(403).json({
        error: 'PLAN_LIMIT_REACHED',
        message: `You have reached the ${plan.toUpperCase()} plan limit of ${limit} numbers.`,
        limit,
        plan
      });
    }
    const linked = await LinkedNumber.create({ number, botName, ownerId: req.user._id });
    res.status(201).json(linked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/numbers/:id/toggle
router.put('/:id/toggle', protect, async (req, res) => {
  try {
    const num = await LinkedNumber.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!num) return res.status(404).json({ error: 'Number not found.' });
    num.status = num.status === 'active' ? 'inactive' : 'active';
    num.lastActive = Date.now();
    await num.save();
    res.json(num);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/numbers/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const num = await LinkedNumber.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
    if (!num) return res.status(404).json({ error: 'Number not found.' });
    res.json({ message: 'Number deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

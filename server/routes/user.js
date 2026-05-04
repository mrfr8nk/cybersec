const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getUserLinkedCount, countNumbersByOwner, findUserByUsername, updateUsername } = require('../db-service');

// GET /api/user/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = req.user;
    const linkedCount = await getUserLinkedCount(user.id);
    res.json({
      id:               user.id,
      username:         user.username,
      email:            user.email,
      role:             user.role,
      subscriptionPlan: user.subscription_plan,
      banned:           user.banned,
      createdAt:        user.created_at,
      lastActive:       user.last_active,
      linkedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required.' });

    const existing = await findUserByUsername(username, req.user.id);
    if (existing) return res.status(409).json({ error: 'Username already taken.' });

    await updateUsername(req.user.id, username);
    res.json({ message: 'Profile updated.', username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const plan   = req.user.subscription_plan;
    const limit  = plan === 'free' ? 5 : plan === 'pro' ? 25 : 999;

    const { getNumbersByOwner } = require('../db-service');
    const numbers = await getNumbersByOwner(userId, null);
    const total  = numbers.length;
    const active = numbers.filter(n => n.status === 'active').length;

    res.json({ total, active, inactive: total - active, plan, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

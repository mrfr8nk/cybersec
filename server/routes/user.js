const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { pool } = require('../db');

// GET /api/user/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = req.user;
    const { rows } = await pool.query(
      'SELECT COUNT(*) FROM linked_numbers WHERE owner_id = $1',
      [user.id]
    );
    const linkedCount = parseInt(rows[0].count);
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      subscriptionPlan: user.subscription_plan,
      banned: user.banned,
      createdAt: user.created_at,
      lastActive: user.last_active,
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
    if (!username) return res.status(400).json({ error: 'Username required.' });
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, req.user.id]
    );
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Username already taken.' });
    await pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, req.user.id]);
    res.json({ message: 'Profile updated.', username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const totalRes = await pool.query('SELECT COUNT(*) FROM linked_numbers WHERE owner_id = $1', [userId]);
    const activeRes = await pool.query("SELECT COUNT(*) FROM linked_numbers WHERE owner_id = $1 AND status = 'active'", [userId]);
    const total = parseInt(totalRes.rows[0].count);
    const active = parseInt(activeRes.rows[0].count);
    const plan = req.user.subscription_plan;
    const limit = plan === 'free' ? 5 : plan === 'pro' ? 25 : 999;
    res.json({ total, active, inactive: total - active, plan, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

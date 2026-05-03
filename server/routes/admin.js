const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { pool } = require('../db');

router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = parseInt((await pool.query('SELECT COUNT(*) FROM users')).rows[0].count);
    const totalNumbers = parseInt((await pool.query('SELECT COUNT(*) FROM linked_numbers')).rows[0].count);
    const bannedUsers = parseInt((await pool.query('SELECT COUNT(*) FROM users WHERE banned = true')).rows[0].count);
    const activeNumbers = parseInt((await pool.query("SELECT COUNT(*) FROM linked_numbers WHERE status = 'active'")).rows[0].count);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const onlineUsers = parseInt((await pool.query('SELECT COUNT(*) FROM users WHERE last_active >= $1', [fiveMinAgo])).rows[0].count);
    const planBreakdown = (await pool.query(
      'SELECT subscription_plan AS _id, COUNT(*) AS count FROM users GROUP BY subscription_plan'
    )).rows.map(r => ({ _id: r._id, count: parseInt(r.count) }));
    res.json({ totalUsers, totalNumbers, bannedUsers, activeNumbers, onlineUsers, planBreakdown });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query, countQuery, params, countParams;
    if (search) {
      query = `SELECT id, username, email, role, subscription_plan, banned, last_active, created_at
               FROM users WHERE username ILIKE $1 OR email ILIKE $1
               ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      countQuery = 'SELECT COUNT(*) FROM users WHERE username ILIKE $1 OR email ILIKE $1';
      params = [`%${search}%`, parseInt(limit), offset];
      countParams = [`%${search}%`];
    } else {
      query = `SELECT id, username, email, role, subscription_plan, banned, last_active, created_at
               FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      countQuery = 'SELECT COUNT(*) FROM users';
      params = [parseInt(limit), offset];
      countParams = [];
    }
    const { rows: users } = await pool.query(query, params);
    const total = parseInt((await pool.query(countQuery, countParams)).rows[0].count);
    res.json({
      users: users.map(u => ({ ...u, subscriptionPlan: u.subscription_plan })),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/numbers
router.get('/numbers', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT ln.*, u.username, u.email
      FROM linked_numbers ln
      JOIN users u ON ln.owner_id = u.id
      ORDER BY ln.created_at DESC LIMIT 100
    `);
    res.json(rows.map(r => ({
      _id: r.id, number: r.number, botName: r.bot_name,
      status: r.status, createdAt: r.created_at,
      ownerId: { username: r.username, email: r.email }
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    const user = rows[0];
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot ban admin.' });
    const newBanned = !user.banned;
    await pool.query('UPDATE users SET banned = $1 WHERE id = $2', [newBanned, user.id]);
    res.json({ message: `User ${newBanned ? 'banned' : 'unbanned'}.`, banned: newBanned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    if (rows[0].role === 'admin') return res.status(403).json({ error: 'Cannot delete admin.' });
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
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
    const { rows } = await pool.query(
      'UPDATE users SET subscription_plan = $1 WHERE id = $2 RETURNING id, username, email, subscription_plan',
      [plan, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: `Plan updated to ${plan}.`, user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

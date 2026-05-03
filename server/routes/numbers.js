const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { pool } = require('../db');

const FREE_LIMIT = 5;

// GET /api/numbers
router.get('/', protect, async (req, res) => {
  try {
    const { search } = req.query;
    let query, params;
    if (search) {
      query = `SELECT * FROM linked_numbers WHERE owner_id = $1
               AND (number ILIKE $2 OR bot_name ILIKE $2)
               ORDER BY created_at DESC`;
      params = [req.user.id, `%${search}%`];
    } else {
      query = 'SELECT * FROM linked_numbers WHERE owner_id = $1 ORDER BY created_at DESC';
      params = [req.user.id];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows.map(formatNumber));
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
    const plan = req.user.subscription_plan;
    const limit = plan === 'free' ? FREE_LIMIT : plan === 'pro' ? 25 : 999;
    const countRes = await pool.query('SELECT COUNT(*) FROM linked_numbers WHERE owner_id = $1', [req.user.id]);
    const count = parseInt(countRes.rows[0].count);
    if (count >= limit) {
      return res.status(403).json({
        error: 'PLAN_LIMIT_REACHED',
        message: `You have reached the ${plan.toUpperCase()} plan limit of ${limit} numbers.`,
        limit, plan
      });
    }
    const { rows } = await pool.query(
      `INSERT INTO linked_numbers (number, bot_name, owner_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [number, botName, req.user.id]
    );
    res.status(201).json(formatNumber(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/numbers/:id/toggle
router.put('/:id/toggle', protect, async (req, res) => {
  try {
    const check = await pool.query(
      'SELECT * FROM linked_numbers WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    );
    if (!check.rows.length) return res.status(404).json({ error: 'Number not found.' });
    const current = check.rows[0];
    const newStatus = current.status === 'active' ? 'inactive' : 'active';
    const { rows } = await pool.query(
      "UPDATE linked_numbers SET status = $1, last_active = NOW() WHERE id = $2 RETURNING *",
      [newStatus, req.params.id]
    );
    res.json(formatNumber(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/numbers/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM linked_numbers WHERE id = $1 AND owner_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Number not found.' });
    res.json({ message: 'Number deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function formatNumber(row) {
  return {
    _id: row.id,
    number: row.number,
    botName: row.bot_name,
    status: row.status,
    ownerId: row.owner_id,
    lastActive: row.last_active,
    createdAt: row.created_at
  };
}

module.exports = router;

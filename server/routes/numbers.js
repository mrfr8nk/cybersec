const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNumbersByOwner,
  countNumbersByOwner,
  addNumber,
  toggleNumber,
  deleteNumber,
} = require('../db-service');

const FREE_LIMIT = 5;

// GET /api/numbers
router.get('/', protect, async (req, res) => {
  try {
    const numbers = await getNumbersByOwner(req.user.id, req.query.search || null);
    res.json(numbers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/numbers
router.post('/', protect, async (req, res) => {
  try {
    const { number, botName } = req.body;
    if (!number || !botName)
      return res.status(400).json({ error: 'Number and bot name are required.' });

    const plan  = req.user.subscription_plan;
    const limit = plan === 'free' ? FREE_LIMIT : plan === 'pro' ? 25 : 999;
    const count = await countNumbersByOwner(req.user.id);

    if (count >= limit) {
      return res.status(403).json({
        error:   'PLAN_LIMIT_REACHED',
        message: `You have reached the ${plan.toUpperCase()} plan limit of ${limit} numbers.`,
        limit, plan,
      });
    }

    const newNumber = await addNumber(number, botName, req.user.id);
    res.status(201).json(newNumber);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/numbers/:id/toggle
router.put('/:id/toggle', protect, async (req, res) => {
  try {
    const updated = await toggleNumber(req.params.id, req.user.id);
    if (!updated) return res.status(404).json({ error: 'Number not found.' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/numbers/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await deleteNumber(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Number not found.' });
    res.json({ message: 'Number deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

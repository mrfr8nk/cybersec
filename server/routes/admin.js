const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getStats,
  getAllUsers,
  findUserById,
  banUser,
  deleteUser,
  updateUserPlan,
  getAllNumbers,
} = require('../db-service');

router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    res.json(await getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const result = await getAllUsers(search || null, parseInt(page), parseInt(limit));
    res.json({
      users: result.users.map(u => ({ ...u, subscriptionPlan: u.subscription_plan })),
      total: result.total,
      page:  parseInt(page),
      pages: result.pages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/numbers
router.get('/numbers', async (req, res) => {
  try {
    res.json(await getAllNumbers());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user)               return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot ban admin.' });
    const newBanned = !user.banned;
    await banUser(user.id, newBanned);
    res.json({ message: `User ${newBanned ? 'banned' : 'unbanned'}.`, banned: newBanned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user)                 return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin.' });
    await deleteUser(user.id);
    res.json({ message: 'User and their numbers deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/plan
router.put('/users/:id/plan', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['free', 'pro', 'enterprise'].includes(plan))
      return res.status(400).json({ error: 'Invalid plan.' });
    const updated = await updateUserPlan(req.params.id, plan);
    if (!updated) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: `Plan updated to ${plan}.`, user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

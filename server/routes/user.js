const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserLinkedCount,
  countNumbersByOwner,
  findUserByUsername,
  updateUsername,
  requestUpgrade,
  getNumbersByOwner,
  findUserById,
} = require('../db-service');

function getPlanLimit(plan) {
  if (plan === 'pro') return 5;
  if (plan === 'enterprise') return 999;
  return 1;
}

// GET /api/user/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    const linkedCount = await getUserLinkedCount(user.id);
    res.json({
      id:               user.id,
      username:         user.username,
      email:            user.email,
      role:             user.role,
      subscriptionPlan: user.subscription_plan,
      trialExpiresAt:   user.trial_expires_at || null,
      upgradeRequest:   user.upgrade_request || 'none',
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
    const user   = await findUserById(userId);
    const plan   = user.subscription_plan;
    const limit  = getPlanLimit(plan);

    const trialExpiresAt = user.trial_expires_at || null;
    const trialExpired   = trialExpiresAt && new Date(trialExpiresAt) < new Date() && plan === 'free';

    const numbers = await getNumbersByOwner(userId, null);
    const total   = numbers.length;
    const active  = numbers.filter(n => n.status === 'active').length;

    res.json({
      total, active, inactive: total - active, plan, limit,
      trialExpiresAt,
      trialExpired: !!trialExpired,
      upgradeRequest: user.upgrade_request || 'none',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user/upgrade-request
router.post('/upgrade-request', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['pro', 'enterprise'].includes(plan))
      return res.status(400).json({ error: 'Invalid plan. Must be pro or enterprise.' });

    const user = await findUserById(req.user.id);
    if (user.subscription_plan === 'pro' && plan === 'pro')
      return res.status(400).json({ error: 'You already have the Pro plan.' });
    if (user.subscription_plan === 'enterprise')
      return res.status(400).json({ error: 'You already have the Enterprise plan.' });

    await requestUpgrade(req.user.id, plan);
    res.json({ message: `Upgrade request to ${plan.toUpperCase()} submitted. Admin will review shortly.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

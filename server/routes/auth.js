const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const { isMongoMode } = require('../db');
const {
  findUserByEmailOrUsername,
  findUserByEmail,
  createUser,
  setTrialExpiry,
} = require('../db-service');
const { generateToken } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    if (username.length < 3 || username.length > 30)
      return res.status(400).json({ error: 'Username must be 3–30 characters.' });

    const existing = await findUserByEmailOrUsername(email, username);
    if (existing) return res.status(409).json({ error: 'Username or email already taken.' });

    const user = await createUser(username, email, password);

    // Set 24-hour free trial
    const trialExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await setTrialExpiry(user.id, trialExpiry);

    const token = generateToken(user.id);
    res.status(201).json({
      token,
      user: {
        id:               user.id,
        username:         user.username,
        email:            user.email,
        role:             user.role,
        subscriptionPlan: user.subscription_plan,
        trialExpiresAt:   trialExpiry.toISOString(),
        createdAt:        user.created_at,
      },
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Server error during signup.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await findUserByEmail(email, true);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    if (user.banned) return res.status(403).json({ error: 'Your account has been banned.' });

    const token = generateToken(user.id);
    res.json({
      token,
      user: {
        id:               user.id,
        username:         user.username,
        email:            user.email,
        role:             user.role,
        subscriptionPlan: user.subscription_plan,
        trialExpiresAt:   user.trial_expires_at || null,
        upgradeRequest:   user.upgrade_request || 'none',
        createdAt:        user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;

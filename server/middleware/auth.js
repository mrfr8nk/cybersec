const jwt = require('jsonwebtoken');
const { findUserById, updateUserLastActive } = require('../db-service');

const JWT_SECRET = process.env.JWT_SECRET || 'cybersecpro_default_secret_change_in_production';

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await findUserById(decoded.id);
    if (!user)       return res.status(401).json({ error: 'User not found.' });
    if (user.banned) return res.status(403).json({ error: 'Account banned.' });

    await updateUserLastActive(decoded.id);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin access required.' });
};

const generateToken = (id) => jwt.sign({ id: String(id) }, JWT_SECRET, { expiresIn: '7d' });

module.exports = { protect, adminOnly, generateToken };

'use strict';

const bcrypt = require('bcryptjs');
const { isMongoMode, getPool } = require('./db');

function M() {
  return {
    User:         require('./models/User'),
    LinkedNumber: require('./models/LinkedNumber'),
    BotSession:   require('./models/BotSession'),
  };
}

function normUser(u) {
  if (!u) return null;
  const o = u.toObject ? u.toObject({ getters: true }) : u;
  return {
    id:                (o._id || o.id) ? String(o._id || o.id) : undefined,
    username:          o.username,
    email:             o.email,
    password:          o.password,
    role:              o.role,
    subscription_plan: o.subscriptionPlan || o.subscription_plan,
    trial_expires_at:  o.trialExpiresAt   || o.trial_expires_at  || null,
    upgrade_request:   o.upgradeRequest   || o.upgrade_request   || 'none',
    upgrade_request_at: o.upgradeRequestAt || o.upgrade_request_at || null,
    banned:            o.banned,
    last_active:       o.lastActive  || o.last_active,
    created_at:        o.createdAt   || o.created_at,
  };
}

function normNumber(n) {
  if (!n) return null;
  const o = n.toObject ? n.toObject({ getters: true }) : n;
  return {
    _id:       String(o._id || o.id),
    number:    o.number,
    botName:   o.botName   || o.bot_name,
    status:    o.status,
    ownerId:   o.ownerId   ? String(o.ownerId) : String(o.owner_id),
    lastActive: o.lastActive || o.last_active,
    createdAt:  o.createdAt  || o.created_at,
  };
}

const pg = () => getPool();

// ════════════════════════════════════════════════════════════════════════════
// USER METHODS
// ════════════════════════════════════════════════════════════════════════════

async function findUserByEmail(email, includePassword = false) {
  if (isMongoMode()) {
    const { User } = M();
    let q = User.findOne({ email: email.toLowerCase() });
    if (includePassword) q = q.select('+password');
    return normUser(await q);
  }
  const { rows } = await pg().query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return rows[0] || null;
}

async function findUserById(id) {
  if (isMongoMode()) {
    const { User } = M();
    try { return normUser(await User.findById(id)); } catch { return null; }
  }
  const { rows } = await pg().query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findUserByEmailOrUsername(email, username) {
  if (isMongoMode()) {
    const { User } = M();
    return normUser(await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] }));
  }
  const { rows } = await pg().query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email.toLowerCase(), username]
  );
  return rows[0] || null;
}

async function findUserByUsername(username, excludeId) {
  if (isMongoMode()) {
    const { User } = M();
    const filter = { username };
    if (excludeId) filter._id = { $ne: excludeId };
    return normUser(await User.findOne(filter));
  }
  const { rows } = await pg().query(
    'SELECT id FROM users WHERE username = $1 AND id != $2',
    [username, excludeId]
  );
  return rows[0] || null;
}

async function createUser(username, email, rawPassword) {
  if (isMongoMode()) {
    const { User } = M();
    const user = new User({ username, email: email.toLowerCase(), password: rawPassword });
    await user.save();
    return normUser(user);
  }
  const hashed = await bcrypt.hash(rawPassword, 12);
  const { rows } = await pg().query(
    `INSERT INTO users (username, email, password) VALUES ($1, $2, $3)
     RETURNING id, username, email, role, subscription_plan, created_at`,
    [username, email.toLowerCase(), hashed]
  );
  return rows[0];
}

async function updateUserLastActive(id) {
  if (isMongoMode()) {
    const { User } = M();
    await User.findByIdAndUpdate(id, { lastActive: new Date() });
    return;
  }
  await pg().query('UPDATE users SET last_active = NOW() WHERE id = $1', [id]);
}

async function updateUsername(id, username) {
  if (isMongoMode()) {
    const { User } = M();
    await User.findByIdAndUpdate(id, { username });
    return;
  }
  await pg().query('UPDATE users SET username = $1 WHERE id = $2', [username, id]);
}

async function setAdminRole(id) {
  if (isMongoMode()) {
    const { User } = M();
    await User.findByIdAndUpdate(id, { role: 'admin' });
    return;
  }
  await pg().query("UPDATE users SET role = 'admin' WHERE id = $1", [id]);
}

async function banUser(id, banned) {
  if (isMongoMode()) {
    const { User } = M();
    await User.findByIdAndUpdate(id, { banned });
    return;
  }
  await pg().query('UPDATE users SET banned = $1 WHERE id = $2', [banned, id]);
}

async function deleteUser(id) {
  if (isMongoMode()) {
    const { User, LinkedNumber } = M();
    await LinkedNumber.deleteMany({ ownerId: id });
    await User.findByIdAndDelete(id);
    return;
  }
  await pg().query('DELETE FROM users WHERE id = $1', [id]);
}

async function updateUserPlan(id, plan) {
  if (isMongoMode()) {
    const { User } = M();
    const u = await User.findByIdAndUpdate(id, { subscriptionPlan: plan, upgradeRequest: 'none' }, { new: true });
    return u ? normUser(u) : null;
  }
  const { rows } = await pg().query(
    "UPDATE users SET subscription_plan = $1, upgrade_request = 'none' WHERE id = $2 RETURNING id, username, email, subscription_plan",
    [plan, id]
  );
  return rows[0] || null;
}

async function setTrialExpiry(id, expiresAt) {
  if (isMongoMode()) {
    const { User } = M();
    await User.findByIdAndUpdate(id, { trialExpiresAt: expiresAt });
    return;
  }
  await pg().query('UPDATE users SET trial_expires_at = $1 WHERE id = $2', [expiresAt, id]);
}

async function requestUpgrade(id, plan) {
  if (isMongoMode()) {
    const { User } = M();
    await User.findByIdAndUpdate(id, { upgradeRequest: plan, upgradeRequestAt: new Date() });
    return;
  }
  await pg().query(
    'UPDATE users SET upgrade_request = $1, upgrade_request_at = NOW() WHERE id = $2',
    [plan, id]
  );
}

async function getPendingUpgradeRequests() {
  if (isMongoMode()) {
    const { User } = M();
    const users = await User.find({ upgradeRequest: { $in: ['pro', 'enterprise'] } }).sort({ upgradeRequestAt: -1 });
    return users.map(u => ({
      id: String(u._id), username: u.username, email: u.email,
      subscriptionPlan: u.subscriptionPlan,
      upgradeRequest: u.upgradeRequest,
      upgradeRequestAt: u.upgradeRequestAt,
    }));
  }
  const { rows } = await pg().query(
    `SELECT id, username, email, subscription_plan, upgrade_request, upgrade_request_at
     FROM users WHERE upgrade_request IN ('pro','enterprise')
     ORDER BY upgrade_request_at DESC`
  );
  return rows.map(r => ({
    id: r.id, username: r.username, email: r.email,
    subscriptionPlan: r.subscription_plan,
    upgradeRequest: r.upgrade_request,
    upgradeRequestAt: r.upgrade_request_at,
  }));
}

async function approveUpgrade(id, plan) {
  if (isMongoMode()) {
    const { User } = M();
    const u = await User.findByIdAndUpdate(id, { subscriptionPlan: plan, upgradeRequest: 'none' }, { new: true });
    return u ? normUser(u) : null;
  }
  const { rows } = await pg().query(
    "UPDATE users SET subscription_plan = $1, upgrade_request = 'none', upgrade_request_at = NULL WHERE id = $2 RETURNING id, username, email, subscription_plan",
    [plan, id]
  );
  return rows[0] || null;
}

async function rejectUpgrade(id) {
  if (isMongoMode()) {
    const { User } = M();
    await User.findByIdAndUpdate(id, { upgradeRequest: 'none', upgradeRequestAt: null });
    return;
  }
  await pg().query(
    "UPDATE users SET upgrade_request = 'none', upgrade_request_at = NULL WHERE id = $1",
    [id]
  );
}

async function getAllUsers(search, page, limit) {
  const offset = (page - 1) * limit;
  if (isMongoMode()) {
    const { User } = M();
    const filter = search
      ? { $or: [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit),
      User.countDocuments(filter),
    ]);
    return { users: users.map(normUser), total, pages: Math.ceil(total / limit) };
  }
  let query, countQuery, params, countParams;
  if (search) {
    query      = `SELECT id,username,email,role,subscription_plan,trial_expires_at,upgrade_request,upgrade_request_at,banned,last_active,created_at FROM users WHERE username ILIKE $1 OR email ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
    countQuery = 'SELECT COUNT(*) FROM users WHERE username ILIKE $1 OR email ILIKE $1';
    params      = [`%${search}%`, parseInt(limit), offset];
    countParams = [`%${search}%`];
  } else {
    query      = `SELECT id,username,email,role,subscription_plan,trial_expires_at,upgrade_request,upgrade_request_at,banned,last_active,created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
    countQuery = 'SELECT COUNT(*) FROM users';
    params      = [parseInt(limit), offset];
    countParams = [];
  }
  const [{ rows: users }, countRes] = await Promise.all([
    pg().query(query, params),
    pg().query(countQuery, countParams),
  ]);
  const total = parseInt(countRes.rows[0].count);
  return { users, total, pages: Math.ceil(total / parseInt(limit)) };
}

async function getStats() {
  if (isMongoMode()) {
    const { User, LinkedNumber } = M();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [totalUsers, totalNumbers, bannedUsers, activeNumbers, onlineUsers, planBreakdown] = await Promise.all([
      User.countDocuments(),
      LinkedNumber.countDocuments(),
      User.countDocuments({ banned: true }),
      LinkedNumber.countDocuments({ status: 'active' }),
      User.countDocuments({ lastActive: { $gte: fiveMinAgo } }),
      User.aggregate([{ $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } }]),
    ]);
    return { totalUsers, totalNumbers, bannedUsers, activeNumbers, onlineUsers, planBreakdown };
  }
  const pool = pg();
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const [tu, tn, bu, an, ou, pb] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users').then(r => parseInt(r.rows[0].count)),
    pool.query('SELECT COUNT(*) FROM linked_numbers').then(r => parseInt(r.rows[0].count)),
    pool.query('SELECT COUNT(*) FROM users WHERE banned = true').then(r => parseInt(r.rows[0].count)),
    pool.query("SELECT COUNT(*) FROM linked_numbers WHERE status = 'active'").then(r => parseInt(r.rows[0].count)),
    pool.query('SELECT COUNT(*) FROM users WHERE last_active >= $1', [fiveMinAgo]).then(r => parseInt(r.rows[0].count)),
    pool.query('SELECT subscription_plan AS _id, COUNT(*) AS count FROM users GROUP BY subscription_plan')
      .then(r => r.rows.map(x => ({ _id: x._id, count: parseInt(x.count) }))),
  ]);
  return { totalUsers: tu, totalNumbers: tn, bannedUsers: bu, activeNumbers: an, onlineUsers: ou, planBreakdown: pb };
}

// ════════════════════════════════════════════════════════════════════════════
// LINKED NUMBER METHODS
// ════════════════════════════════════════════════════════════════════════════

async function getNumbersByOwner(userId, search) {
  if (isMongoMode()) {
    const { LinkedNumber } = M();
    const filter = { ownerId: userId };
    if (search) filter.$or = [
      { number:  { $regex: search, $options: 'i' } },
      { botName: { $regex: search, $options: 'i' } },
    ];
    return (await LinkedNumber.find(filter).sort({ createdAt: -1 })).map(normNumber);
  }
  let query, params;
  if (search) {
    query  = `SELECT * FROM linked_numbers WHERE owner_id=$1 AND (number ILIKE $2 OR bot_name ILIKE $2) ORDER BY created_at DESC`;
    params = [userId, `%${search}%`];
  } else {
    query  = 'SELECT * FROM linked_numbers WHERE owner_id=$1 ORDER BY created_at DESC';
    params = [userId];
  }
  const { rows } = await pg().query(query, params);
  return rows.map(r => ({ _id: r.id, number: r.number, botName: r.bot_name, status: r.status, ownerId: r.owner_id, lastActive: r.last_active, createdAt: r.created_at }));
}

async function countNumbersByOwner(userId) {
  if (isMongoMode()) {
    const { LinkedNumber } = M();
    return LinkedNumber.countDocuments({ ownerId: userId });
  }
  const { rows } = await pg().query('SELECT COUNT(*) FROM linked_numbers WHERE owner_id=$1', [userId]);
  return parseInt(rows[0].count);
}

async function getUserLinkedCount(userId) {
  return countNumbersByOwner(userId);
}

async function addNumber(number, botName, userId) {
  if (isMongoMode()) {
    const { LinkedNumber } = M();
    const n = new LinkedNumber({ number, botName, ownerId: userId });
    await n.save();
    return normNumber(n);
  }
  const { rows } = await pg().query(
    'INSERT INTO linked_numbers (number, bot_name, owner_id) VALUES ($1,$2,$3) RETURNING *',
    [number, botName, userId]
  );
  const r = rows[0];
  return { _id: r.id, number: r.number, botName: r.bot_name, status: r.status, ownerId: r.owner_id, lastActive: r.last_active, createdAt: r.created_at };
}

async function toggleNumber(id, userId) {
  if (isMongoMode()) {
    const { LinkedNumber } = M();
    try {
      const n = await LinkedNumber.findOne({ _id: id, ownerId: userId });
      if (!n) return null;
      n.status = n.status === 'active' ? 'inactive' : 'active';
      n.lastActive = new Date();
      await n.save();
      return normNumber(n);
    } catch { return null; }
  }
  const check = await pg().query('SELECT * FROM linked_numbers WHERE id=$1 AND owner_id=$2', [id, userId]);
  if (!check.rows.length) return null;
  const newStatus = check.rows[0].status === 'active' ? 'inactive' : 'active';
  const { rows } = await pg().query(
    "UPDATE linked_numbers SET status=$1, last_active=NOW() WHERE id=$2 RETURNING *",
    [newStatus, id]
  );
  const r = rows[0];
  return { _id: r.id, number: r.number, botName: r.bot_name, status: r.status, ownerId: r.owner_id, lastActive: r.last_active, createdAt: r.created_at };
}

async function deleteNumber(id, userId) {
  if (isMongoMode()) {
    const { LinkedNumber } = M();
    try {
      const result = await LinkedNumber.findOneAndDelete({ _id: id, ownerId: userId });
      return !!result;
    } catch { return false; }
  }
  const { rows } = await pg().query(
    'DELETE FROM linked_numbers WHERE id=$1 AND owner_id=$2 RETURNING id',
    [id, userId]
  );
  return rows.length > 0;
}

async function getAllNumbers() {
  if (isMongoMode()) {
    const { LinkedNumber } = M();
    const nums = await LinkedNumber.find().sort({ createdAt: -1 }).limit(100).populate('ownerId', 'username email');
    return nums.map(n => ({
      _id: n._id.toString(), number: n.number, botName: n.botName, status: n.status, createdAt: n.createdAt,
      ownerId: { username: n.ownerId?.username, email: n.ownerId?.email },
    }));
  }
  const { rows } = await pg().query(`
    SELECT ln.*, u.username, u.email
    FROM linked_numbers ln JOIN users u ON ln.owner_id = u.id
    ORDER BY ln.created_at DESC LIMIT 100
  `);
  return rows.map(r => ({
    _id: r.id, number: r.number, botName: r.bot_name, status: r.status, createdAt: r.created_at,
    ownerId: { username: r.username, email: r.email },
  }));
}

// ════════════════════════════════════════════════════════════════════════════
// BOT SESSION METHODS
// ════════════════════════════════════════════════════════════════════════════

async function upsertBotSession(number, status) {
  const clean = number.replace(/[^0-9]/g, '');
  if (!clean) return;
  if (isMongoMode()) {
    const { BotSession } = M();
    await BotSession.findOneAndUpdate(
      { number: clean },
      { status, lastActive: new Date(), ...(status === 'active' ? { connectedAt: new Date() } : {}) },
      { upsert: true, new: true }
    );
    return;
  }
  await pg().query(
    `INSERT INTO bot_sessions (number, status, connected_at, last_active)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (number) DO UPDATE
       SET status = $2, last_active = NOW(),
           connected_at = CASE WHEN $2='active' THEN NOW() ELSE bot_sessions.connected_at END`,
    [clean, status, status === 'active' ? new Date() : null]
  );
}

async function getActiveBotSessions() {
  if (isMongoMode()) {
    const { BotSession } = M();
    return (await BotSession.find({ status: 'active' }).sort({ lastActive: -1 })).map(s => s.number);
  }
  const { rows } = await pg().query("SELECT number FROM bot_sessions WHERE status='active' ORDER BY last_active DESC");
  return rows.map(r => r.number);
}

// ════════════════════════════════════════════════════════════════════════════
// SITE SETTINGS (for audio and other config)
// ════════════════════════════════════════════════════════════════════════════

async function getSiteSetting(key) {
  if (isMongoMode()) {
    try {
      const SiteSettings = require('./models/SiteSettings');
      const doc = await SiteSettings.findOne({ key });
      return doc ? doc.value : null;
    } catch { return null; }
  }
  try {
    const { rows } = await pg().query('SELECT value FROM site_settings WHERE key = $1', [key]);
    return rows[0] ? rows[0].value : null;
  } catch { return null; }
}

async function setSiteSetting(key, value) {
  if (isMongoMode()) {
    try {
      const SiteSettings = require('./models/SiteSettings');
      await SiteSettings.findOneAndUpdate({ key }, { key, value }, { upsert: true });
    } catch { }
    return;
  }
  try {
    await pg().query(
      `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value]
    );
  } catch { }
}

module.exports = {
  findUserByEmail, findUserById, findUserByEmailOrUsername, findUserByUsername,
  createUser, updateUserLastActive, updateUsername, setAdminRole,
  banUser, deleteUser, updateUserPlan, getAllUsers, getStats,
  setTrialExpiry, requestUpgrade, getPendingUpgradeRequests, approveUpgrade, rejectUpgrade,
  getNumbersByOwner, countNumbersByOwner, getUserLinkedCount,
  addNumber, toggleNumber, deleteNumber, getAllNumbers,
  upsertBotSession, getActiveBotSessions,
  getSiteSetting, setSiteSetting,
};

require('dotenv').config();

process.on('uncaughtException',  err => console.error('[Server] Uncaught exception (non-fatal):', err.message));
process.on('unhandledRejection', err => console.error('[Server] Unhandled rejection (non-fatal):', err?.message || err));

const path        = require('path');
const fs          = require('fs');
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit   = require('express-rate-limit');
const bcrypt      = require('bcryptjs');

const { initDb }  = require('./db');
const svc         = require('./db-service');

const authRoutes    = require('./routes/auth');
const userRoutes    = require('./routes/user');
const numbersRoutes = require('./routes/numbers');
const adminRoutes   = require('./routes/admin');
const pairingRoutes = require('./routes/pairing');

const app  = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests, please try again later.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Too many auth requests, please try again later.' } });

app.use('/api/',      limiter);
app.use('/api/auth/', authLimiter);

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10kb' }));

// ── Serve uploaded audio files ──────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Public audio info endpoint (no auth required) ───────────────────────────
app.get('/api/site/audio', async (req, res) => {
  try {
    const filename = await svc.getSiteSetting('site_audio_filename');
    const original = await svc.getSiteSetting('site_audio_original');
    res.json({ filename: filename || '', original: original || '' });
  } catch (err) {
    res.json({ filename: '', original: '' });
  }
});

// ── API routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/user',    userRoutes);
app.use('/api/numbers', numbersRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/pairing', pairingRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'CYBERSECPRO API Online', db: process.env.MONGO_URL ? 'MongoDB' : 'PostgreSQL', timestamp: new Date() })
);

// ── Serve compiled React frontend (production) ──────────────────────────────
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// ── Auto-create admin from env vars ────────────────────────────────────────
async function ensureAdminAccount() {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  try {
    let user = await svc.findUserByEmail(email);
    if (!user) {
      let username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 28) || 'admin';
      const existing = await svc.findUserByUsername(username, null);
      if (existing) username = username + '_admin';

      user = await svc.createUser(username, email, password);
      console.log(`✅ Admin account created: ${email} (username: ${username})`);
    }
    if (user.role !== 'admin') {
      await svc.setAdminRole(user.id);
      console.log(`✅ Admin role granted to: ${email}`);
    }
  } catch (err) {
    console.error('⚠️  Admin auto-create failed:', err.message);
  }
}

// ── Boot sequence ───────────────────────────────────────────────────────────
initDb()
  .then(async () => {
    await ensureAdminAccount();

    app.listen(PORT, '0.0.0.0', () =>
      console.log(`🚀 CYBERSECPRO API running on port ${PORT}`)
    );

    setTimeout(async () => {
      try {
        const { autoLoadPairs } = require('../autoload');
        const result = await autoLoadPairs({ batchSize: 3 });
        console.log(`🔄 Sessions restored: ${result.successful}/${result.total}`);
      } catch (err) {
        console.error('⚠️  Session auto-load error:', err.message);
      }
    }, 5000);
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err.message);
    process.exit(1);
  });

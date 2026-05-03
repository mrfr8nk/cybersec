require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const numbersRoutes = require('./routes/numbers');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Replit's proxy
app.set('trust proxy', 1);

app.use(helmet());
app.use(mongoSanitize());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many auth requests, please try again later.' }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/numbers', numbersRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'CYBERSECPRO API Online', db: 'PostgreSQL', timestamp: new Date() }));

initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 CYBERSECPRO API running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err.message);
    process.exit(1);
  });

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const numbersRoutes = require('./routes/numbers');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(mongoSanitize());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth requests, please try again later.' }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/numbers', numbersRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'CYBERSECPRO API Online', timestamp: new Date() }));

const startServer = () => {
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 CYBERSECPRO API running on port ${PORT}`));
};

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
    bufferCommands: false,
  })
    .then(() => {
      console.log('✅ MongoDB Connected');
      startServer();
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('⚠️  Starting server without DB (limited functionality)');
      startServer();
    });
} else {
  console.warn('⚠️  MONGODB_URI not set — starting without database');
  startServer();
}

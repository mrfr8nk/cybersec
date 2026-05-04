require('dotenv').config();
const mongoose = require('mongoose');
const { Pool } = require('pg');

// ── Connection priority ────────────────────────────────────────────────────
// 1. MONGO_URL env var          → MongoDB (Mongoose)
// 2. DATABASE_URL env var       → PostgreSQL (pg)
// 3. Hardcoded Replit fallback  → PostgreSQL on Replit's internal network
//    (this fallback only works when the server runs inside Replit itself)
const REPLIT_DB_FALLBACK = 'postgresql://postgres:password@helium/heliumdb?sslmode=disable';

const MONGO_URL   = process.env.MONGO_URL;
const PG_URL      = process.env.DATABASE_URL || REPLIT_DB_FALLBACK;

let _pool         = null;
let _mongoMode    = false;

const isMongoMode = () => _mongoMode;
const getPool     = () => _pool;

const initDb = async () => {
  if (MONGO_URL) {
    _mongoMode = true;
    await mongoose.connect(MONGO_URL, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ MongoDB connected');
    return;
  }

  // ── PostgreSQL mode ──────────────────────────────────────────────────────
  _pool = new Pool({
    connectionString: PG_URL,
    ssl: PG_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
  });

  const client = await _pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                SERIAL PRIMARY KEY,
        username          VARCHAR(30)  UNIQUE NOT NULL,
        email             VARCHAR(255) UNIQUE NOT NULL,
        password          VARCHAR(255) NOT NULL,
        role              VARCHAR(10)  DEFAULT 'user'  CHECK (role IN ('user','admin')),
        subscription_plan VARCHAR(20)  DEFAULT 'free'  CHECK (subscription_plan IN ('free','pro','enterprise')),
        banned            BOOLEAN      DEFAULT false,
        last_active       TIMESTAMPTZ  DEFAULT NOW(),
        created_at        TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS linked_numbers (
        id          SERIAL PRIMARY KEY,
        number      VARCHAR(50) NOT NULL,
        bot_name    VARCHAR(50) NOT NULL,
        status      VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active','inactive')),
        owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_active TIMESTAMPTZ DEFAULT NOW(),
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bot_sessions (
        id           SERIAL PRIMARY KEY,
        number       VARCHAR(50) UNIQUE NOT NULL,
        status       VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('active','inactive','pending')),
        connected_at TIMESTAMPTZ,
        last_active  TIMESTAMPTZ DEFAULT NOW(),
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('✅ PostgreSQL tables ready');
  } finally {
    client.release();
  }
};

module.exports = { initDb, isMongoMode, getPool };

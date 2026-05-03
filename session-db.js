// Thin PostgreSQL client used by pair.js to persist session state.
// Uses pg from server/node_modules so root package.json stays clean.
let pool = null;

function getPool() {
  if (pool) return pool;
  try {
    const { Pool } = require('./server/node_modules/pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
      max: 3,
      idleTimeoutMillis: 30000,
    });
    pool.on('error', () => {}); // swallow idle-client errors silently
  } catch (_) {
    pool = null;
  }
  return pool;
}

/**
 * Upsert a session row into bot_sessions.
 * @param {string} number  – digits only (e.g. "263719647303")
 * @param {'active'|'inactive'|'pending'} status
 */
async function updateSession(number, status) {
  const db = getPool();
  if (!db) return;
  const clean = number.replace(/[^0-9]/g, '');
  if (!clean) return;
  try {
    await db.query(
      `INSERT INTO bot_sessions (number, status, connected_at, last_active)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (number) DO UPDATE
         SET status      = $2,
             last_active = NOW(),
             connected_at = CASE WHEN $2 = 'active' THEN NOW()
                                 ELSE bot_sessions.connected_at END`,
      [clean, status, status === 'active' ? new Date() : null]
    );
  } catch (err) {
    // Non-fatal — session file is the source of truth
    console.error('[session-db] update failed:', err.message);
  }
}

/**
 * Return all numbers that have status 'active' in bot_sessions.
 * Used by autoload to know which sessions to reconnect.
 */
async function getActiveSessions() {
  const db = getPool();
  if (!db) return [];
  try {
    const { rows } = await db.query(
      `SELECT number FROM bot_sessions WHERE status = 'active' ORDER BY last_active DESC`
    );
    return rows.map(r => r.number);
  } catch (err) {
    console.error('[session-db] getActiveSessions failed:', err.message);
    return [];
  }
}

module.exports = { updateSession, getActiveSessions };

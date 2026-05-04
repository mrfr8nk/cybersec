// Thin database client used by pair.js (root level) to persist session state.
// Supports both MongoDB (via db-service) and PostgreSQL (via pg pool).
// All failures are non-fatal — the filesystem session is the source of truth.

let _ready = false;

async function _init() {
  if (_ready) return;
  try {
    require('./server/db');            // load env / initialise pool
    const { initDb } = require('./server/db');
    await initDb();
  } catch (_) {}
  _ready = true;
}

/**
 * Upsert a session row.
 * @param {string} number  – digits only, or JID like "263xxx@s.whatsapp.net"
 * @param {'active'|'inactive'|'pending'} status
 */
async function updateSession(number, status) {
  try {
    await _init();
    const { upsertBotSession } = require('./server/db-service');
    await upsertBotSession(number, status);
  } catch (err) {
    console.error('[session-db] update failed:', err.message);
  }
}

/**
 * Return all numbers currently marked active.
 * @returns {Promise<string[]>}
 */
async function getActiveSessions() {
  try {
    await _init();
    const { getActiveBotSessions } = require('./server/db-service');
    return await getActiveBotSessions();
  } catch (err) {
    console.error('[session-db] getActiveSessions failed:', err.message);
    return [];
  }
}

module.exports = { updateSession, getActiveSessions };

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const PAIRING_BASE = path.join(__dirname, '../../nexstore/pairing');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function deleteFolderRecursive(p) {
  if (!fs.existsSync(p)) return;
  fs.readdirSync(p).forEach(f => {
    const cur = path.join(p, f);
    fs.lstatSync(cur).isDirectory() ? deleteFolderRecursive(cur) : fs.unlinkSync(cur);
  });
  try { fs.rmdirSync(p); } catch (_) {}
}

// Load Baileys from root node_modules (same version pair.js uses)
function getBaileys() {
  const rootPath = path.join(__dirname, '../../node_modules/@whiskeysockets/baileys');
  const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    Browsers,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
  } = require(rootPath);
  const { Boom } = require(path.join(__dirname, '../../node_modules/@hapi/boom'));
  const pino    = require(path.join(__dirname, '../../node_modules/pino'));
  const NodeCache = require(path.join(__dirname, '../../node_modules/node-cache'));
  return { makeWASocket, DisconnectReason, useMultiFileAuthState,
           Browsers, fetchLatestBaileysVersion, makeInMemoryStore, Boom, pino, NodeCache };
}

// Track in-progress pairing sockets so we can clean them up
const pendingSockets = new Map();

// ── POST /api/pairing/request ─────────────────────────────────────────────────
router.post('/request', protect, async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number required.' });

  const clean = phoneNumber.replace(/[^0-9]/g, '');
  if (clean.length < 7 || clean.length > 15)
    return res.status(400).json({ error: 'Invalid phone number format.' });

  // Kill any existing pending socket for this number
  if (pendingSockets.has(clean)) {
    try { pendingSockets.get(clean).end(); } catch (_) {}
    pendingSockets.delete(clean);
  }

  const sessionPath = path.join(PAIRING_BASE, clean);

  // Wipe any stale session so we always get a fresh code
  if (fs.existsSync(sessionPath)) deleteFolderRecursive(sessionPath);
  ensureDir(PAIRING_BASE);
  ensureDir(sessionPath);

  let sock;
  try {
    const {
      makeWASocket, DisconnectReason, useMultiFileAuthState,
      Browsers, fetchLatestBaileysVersion, makeInMemoryStore, Boom, pino, NodeCache
    } = getBaileys();

    const logger = pino({ level: 'silent' });
    const store  = makeInMemoryStore({ logger: logger.child({ level: 'silent', stream: 'store' }) });
    const msgRetryCounterCache = new NodeCache();

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    // Use auth: state directly — exactly like pair.js — avoids the crypto error
    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: state,
      browser: Browsers.ubuntu('Edge'),
      msgRetryCounterCache,
      getMessage: async key => {
        if (store) {
          const msg = await store.loadMessage(key.remoteJid, key.id);
          return msg?.message || undefined;
        }
        return { conversation: '' };
      },
      shouldSyncHistoryMessage: () => false,
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 60_000,
      keepAliveIntervalMs: 30_000,
      emitOwnEvents: true,
      fireInitQueries: true,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    store.bind(sock.ev);
    sock.ev.on('creds.update', saveCreds);
    pendingSockets.set(clean, sock);

    // ── Step 1: get the pairing code (same 3 s delay as pair.js) ──────────────
    const code = await new Promise((resolve, reject) => {
      const TIMEOUT = 35_000;
      const timer = setTimeout(() => {
        reject(new Error('Timed out waiting for pairing code. Check the number and try again.'));
      }, TIMEOUT);

      setTimeout(async () => {
        try {
          let pairCode = await sock.requestPairingCode(clean);
          pairCode = pairCode?.match(/.{1,4}/g)?.join('-') || pairCode;
          clearTimeout(timer);
          resolve(pairCode);
        } catch (err) {
          clearTimeout(timer);
          reject(err);
        }
      }, 3000);

      // Hard-fail on fatal WhatsApp errors during code request
      sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
          const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
          const fatal = statusCode === DisconnectReason.loggedOut
                     || statusCode === 401
                     || statusCode === 405
                     || statusCode === 403;
          if (fatal) {
            clearTimeout(timer);
            deleteFolderRecursive(sessionPath);
            reject(new Error(`WhatsApp rejected pairing (${statusCode}). Try again.`));
          }
        }
      });
    });

    // ── Step 2: return code to client immediately — socket stays alive ─────────
    res.json({ code, number: clean });

    // ── Step 3: in background, wait for the user to enter the code ────────────
    // When WhatsApp confirms (connection === 'open'), hand off to pair.js
    // exactly like the Telegram bot did.
    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (connection === 'open') {
        console.log(`[Pairing] ✅ ${clean} confirmed pairing — booting bot via pair.js`);
        pendingSockets.delete(clean);

        // End this lightweight socket — pair.js will create its own
        try { sock.end(); } catch (_) {}

        // Small delay to let creds flush to disk
        await new Promise(r => setTimeout(r, 1500));

        try {
          // Load startpairing from root pair.js (same as autoload.js does)
          const startpairing = require('../../pair');
          await startpairing(clean);
          console.log(`[Pairing] 🎉 Bot is live for ${clean}`);
        } catch (err) {
          console.error(`[Pairing] ❌ Failed to start bot for ${clean}:`, err.message);
        }

      } else if (connection === 'close') {
        // If WhatsApp closes before confirming, clean up
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 405) {
          console.log(`[Pairing] Session for ${clean} closed before confirming (${statusCode})`);
          pendingSockets.delete(clean);
          deleteFolderRecursive(sessionPath);
        }
      }
    });

  } catch (err) {
    if (sock) { try { sock.end(); } catch (_) {} }
    pendingSockets.delete(clean);
    console.error('[Pairing]', err.message);
    return res.status(500).json({ error: err.message || 'Could not generate pairing code. Please try again.' });
  }
});

module.exports = router;

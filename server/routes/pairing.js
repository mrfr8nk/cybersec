const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const PAIRING_BASE = path.join(__dirname, '../../nexstore/pairing');

// ── helpers ──────────────────────────────────────────────────────────────────
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function deleteFolderRecursive(p) {
  if (!fs.existsSync(p)) return;
  fs.readdirSync(p).forEach(f => {
    const cur = path.join(p, f);
    fs.lstatSync(cur).isDirectory() ? deleteFolderRecursive(cur) : fs.unlinkSync(cur);
  });
  fs.rmdirSync(p);
}

function isRegistered(sessionPath) {
  const credsPath = path.join(sessionPath, 'creds.json');
  if (!fs.existsSync(credsPath)) return false;
  try {
    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    return !!(creds?.me?.id);
  } catch (_) { return false; }
}

// ── lazy-load Baileys deps (installed in server/node_modules) ─────────────────
function getBaileys() {
  const {
    default: makeWASocket,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    Browsers,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
  } = require('@whiskeysockets/baileys');
  const { Boom } = require('@hapi/boom');
  const pino    = require('pino');
  const NodeCache = require('node-cache');
  return { makeWASocket, DisconnectReason, makeCacheableSignalKeyStore,
           useMultiFileAuthState, Browsers, fetchLatestBaileysVersion,
           makeInMemoryStore, Boom, pino, NodeCache };
}

// ── POST /api/pairing/request ─────────────────────────────────────────────────
router.post('/request', protect, async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number required.' });

  const clean = phoneNumber.replace(/[^0-9]/g, '');
  if (clean.length < 7 || clean.length > 15)
    return res.status(400).json({ error: 'Invalid phone number format.' });

  const sessionPath = path.join(PAIRING_BASE, clean);

  // Already registered → no code needed
  if (isRegistered(sessionPath))
    return res.json({ code: null, alreadyPaired: true });

  // Wipe any broken incomplete session
  if (fs.existsSync(sessionPath)) deleteFolderRecursive(sessionPath);
  ensureDir(PAIRING_BASE);
  ensureDir(sessionPath);

  let sock;
  try {
    const {
      makeWASocket, DisconnectReason, makeCacheableSignalKeyStore,
      useMultiFileAuthState, Browsers, fetchLatestBaileysVersion,
      makeInMemoryStore, Boom, pino, NodeCache
    } = getBaileys();

    const logger = pino({ level: 'silent' });

    // In-memory store — exactly like pair.js
    const store = makeInMemoryStore({ logger: logger.child({ level: 'silent', stream: 'store' }) });

    // msgRetryCounterCache — exactly like pair.js
    const msgRetryCounterCache = new NodeCache();

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
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
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      emitOwnEvents: true,
      fireInitQueries: true,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
    });

    store.bind(sock.ev);
    sock.ev.on('creds.update', saveCreds);

    // ── get code via promise — mirrors pair.js setTimeout(..., 3000) ──────────
    const code = await new Promise((resolve, reject) => {
      const TIMEOUT = 35000;
      const timer = setTimeout(() => {
        reject(new Error('Timed out waiting for pairing code. Check the number and try again.'));
      }, TIMEOUT);

      // Exactly as pair.js: wait 3 000 ms then requestPairingCode
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

      // Hard-fail on fatal WhatsApp errors
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

    try { sock.end(); } catch (_) {}

    return res.json({ code, number: clean });

  } catch (err) {
    if (sock) try { sock.end(); } catch (_) {}
    console.error('[Pairing]', err.message);
    return res.status(500).json({ error: err.message || 'Could not generate pairing code. Please try again.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const PAIRING_BASE = path.join(__dirname, '../../nexstore/pairing');

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach(file => {
      const cur = path.join(folderPath, file);
      if (fs.lstatSync(cur).isDirectory()) deleteFolderRecursive(cur);
      else fs.unlinkSync(cur);
    });
    fs.rmdirSync(folderPath);
  }
}

// POST /api/pairing/request
router.post('/request', protect, async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number required.' });

  const clean = phoneNumber.replace(/[^0-9]/g, '');
  if (clean.length < 7 || clean.length > 15) {
    return res.status(400).json({ error: 'Invalid phone number format.' });
  }

  let sock;
  try {
    const {
      default: makeWASocket,
      useMultiFileAuthState,
      fetchLatestBaileysVersion,
      DisconnectReason,
      Browsers,
      makeCacheableSignalKeyStore
    } = require('@whiskeysockets/baileys');
    const pino = require('pino');
    const { Boom } = require('@hapi/boom');

    const sessionPath = path.join(PAIRING_BASE, clean);

    // Clean old broken session if exists
    const credsPath = path.join(sessionPath, 'creds.json');
    if (fs.existsSync(credsPath)) {
      try {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        if (creds?.me?.id) {
          // Already registered — just report paired
          return res.json({ code: null, alreadyPaired: true });
        }
        // Corrupt / incomplete session — wipe and re-pair
        deleteFolderRecursive(sessionPath);
      } catch (_) {
        deleteFolderRecursive(sessionPath);
      }
    }

    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
      },
      browser: Browsers.ubuntu('Edge'),
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      markOnlineOnConnect: true,
    });

    sock.ev.on('creds.update', saveCreds);

    // Resolve once we have the code; reject on hard failure
    const code = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Pairing code request timed out. Check your number and try again.'));
      }, 30000);

      // Exactly like pair.js — wait 3s after socket init then request code
      setTimeout(async () => {
        try {
          let pairCode = await sock.requestPairingCode(clean);
          pairCode = pairCode?.match(/.{1,4}/g)?.join('-') || pairCode;
          clearTimeout(timeout);
          resolve(pairCode);
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      }, 3000);

      // Also handle early connection errors
      sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
          const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
          if (reason === DisconnectReason.loggedOut || reason === 401 || reason === 405) {
            clearTimeout(timeout);
            deleteFolderRecursive(sessionPath);
            reject(new Error('WhatsApp rejected the session. Please try again.'));
          }
        }
      });
    });

    // Close socket cleanly after getting code
    try { sock.end(); } catch (_) {}

    return res.json({ code, number: clean });

  } catch (err) {
    if (sock) try { sock.end(); } catch (_) {}
    console.error('Pairing error:', err.message);
    return res.status(500).json({ error: err.message || 'Could not generate pairing code. Please try again.' });
  }
});

module.exports = router;

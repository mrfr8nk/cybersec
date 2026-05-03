const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const PAIRING_BASE = path.join(__dirname, '../../nexstore/pairing');

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
      Browsers
    } = require('@whiskeysockets/baileys');
    const pino = require('pino');

    const sessionPath = path.join(PAIRING_BASE, clean);
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: Browsers.ubuntu('Edge'),
    });

    sock.ev.on('creds.update', saveCreds);

    // Wait briefly for socket to initialize
    await new Promise(r => setTimeout(r, 1500));

    if (state.creds.registered) {
      sock.end();
      return res.json({ code: null, alreadyPaired: true });
    }

    const code = await sock.requestPairingCode(clean);
    const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
    sock.end();
    return res.json({ code: formatted, number: clean });
  } catch (err) {
    if (sock) try { sock.end(); } catch (_) {}
    console.error('Pairing error:', err.message);
    return res.status(500).json({ error: 'Could not generate pairing code. Please try again.' });
  }
});

module.exports = router;

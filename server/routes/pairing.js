const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const PAIRING_BASE = path.join(__dirname, '../../nexstore/pairing');
const PAIRING_JSON  = path.join(PAIRING_BASE, 'pairing.json');

// Root pair.js — same module bot.js uses
const PAIR_MODULE = path.join(__dirname, '../../pair');

function ensureDir(p) {
  if (!fsSync.existsSync(p)) fsSync.mkdirSync(p, { recursive: true });
}

function deleteFolderRecursive(p) {
  if (!fsSync.existsSync(p)) return;
  fsSync.readdirSync(p).forEach(f => {
    const cur = path.join(p, f);
    fsSync.lstatSync(cur).isDirectory() ? deleteFolderRecursive(cur) : fsSync.unlinkSync(cur);
  });
  try { fsSync.rmdirSync(p); } catch (_) {}
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── POST /api/pairing/request ─────────────────────────────────────────────────
// Mirrors exactly what bot.js /pair command does:
//  1. Call startpairing(jid) from pair.js  (keeps socket alive in background)
//  2. Wait ~4 s for pair.js to write code to pairing.json
//  3. Read the code and return it
//  4. pair.js socket stays alive — when user enters the code WhatsApp
//     confirms and the full bot boots automatically
router.post('/request', protect, async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: 'Phone number required.' });

  const clean = phoneNumber.replace(/[^0-9]/g, '');
  if (clean.length < 7 || clean.length > 15)
    return res.status(400).json({ error: 'Invalid phone number format.' });

  const sessionPath = path.join(PAIRING_BASE, clean);

  // Wipe stale session so pair.js always issues a fresh code
  if (fsSync.existsSync(sessionPath)) deleteFolderRecursive(sessionPath);
  ensureDir(PAIRING_BASE);
  ensureDir(sessionPath);

  // Remove old pairing.json so we don't accidentally return a stale code
  try { await fs.unlink(PAIRING_JSON); } catch (_) {}

  try {
    // Load startpairing from root pair.js — exactly what bot.js does
    // Clear require cache so a fresh connection is created each time
    delete require.cache[require.resolve(PAIR_MODULE)];
    const startpairing = require(PAIR_MODULE);

    const jid = clean + '@s.whatsapp.net';

    // Fire and forget — pair.js keeps the socket alive in the background
    startpairing(jid).catch(err => {
      console.error(`[Pairing] startpairing error for ${clean}:`, err.message);
    });

    // Wait for pair.js to write pairing.json
    // pair.js stores number as "263xxx@s.whatsapp.net" so we match digits only
    let code = null;
    const deadline = Date.now() + 40_000;
    while (Date.now() < deadline) {
      await sleep(1000);
      try {
        const raw = await fs.readFile(PAIRING_JSON, 'utf-8');
        const obj = JSON.parse(raw);
        const savedNum = (obj.number || '').replace(/[^0-9]/g, '');
        if (obj.code && savedNum === clean) {
          code = obj.code;
          break;
        }
      } catch (_) {}
    }

    if (!code) {
      return res.status(500).json({ error: 'Timed out waiting for pairing code. Check the number and try again.' });
    }

    return res.json({ code, number: clean });

  } catch (err) {
    console.error('[Pairing]', err.message);
    return res.status(500).json({ error: err.message || 'Could not generate pairing code. Please try again.' });
  }
});

module.exports = router;

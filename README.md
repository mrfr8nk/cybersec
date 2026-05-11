# CyberSecPro — WhatsApp Bot Management SaaS

A full-stack cyberpunk SaaS platform where users sign up, link their WhatsApp numbers via pairing codes, and manage their bot sessions through a holographic web dashboard. Powered by Baileys, MongoDB, Express, and React.

---

## One-Click Heroku Deploy

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/mrfr8nk/cybersec)

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Deployment Guides](#deployment-guides)
  - [Heroku](#heroku)
  - [Railway](#railway)
  - [Render](#render)
  - [VPS (Ubuntu / Debian)](#vps-ubuntu--debian)
- [Admin Access](#admin-access)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    CyberSecPro                       │
│                                                      │
│  ┌─────────────────┐     ┌──────────────────────┐   │
│  │  React + Vite   │────▶│  Express.js API      │   │
│  │   (Frontend)    │/api │  server/index.js     │   │
│  └─────────────────┘     │  Port: $PORT (3001)  │   │
│                          └──────────┬───────────┘   │
│                                     │               │
│                          ┌──────────▼───────────┐   │
│                          │   MongoDB (Mongoose)  │   │
│                          │   via MONGO_URL       │   │
│                          └──────────────────────┘   │
│                                                      │
│  ┌───────────────────────────────────────────────┐   │
│  │  pair.js  (Baileys — WhatsApp multi-session)  │   │
│  │  Sessions → nexstore/pairing/                 │   │
│  │  Auto-reconnects on every server restart      │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌───────────────────────────────────────────────┐   │
│  │  bot.js / Telegraf (Telegram bot integration) │   │
│  │  Token read from TELEGRAM_BOT_TOKEN env var   │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Key facts:**
- Node.js **20.x** required — Baileys will not run on Node 18
- Uses **MongoDB only** — set `MONGO_URL` to your Atlas cluster
- WhatsApp session files live in `nexstore/pairing/` — needs persistent storage on cloud platforms
- The Express backend serves the compiled React frontend as static files in production
- Admin account is auto-created on first boot using `ADMIN_EMAIL` + `ADMIN_PASSWORD`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js 20, Express.js |
| Database | MongoDB (Mongoose) |
| WhatsApp | @whiskeysockets/baileys (multi-device) |
| Telegram | Telegraf, node-telegram-bot-api |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Security | Helmet, express-rate-limit, express-mongo-sanitize |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | **Yes** | MongoDB connection string. Get a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas). Example: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/cybersecpro` |
| `JWT_SECRET` | **Yes** | Long random string for signing auth tokens. Generate one: `openssl rand -hex 64` |
| `TELEGRAM_BOT_TOKEN` | No | Your Telegram bot token from [@BotFather](https://t.me/BotFather) |
| `ADMIN_EMAIL` | No | Email for the auto-created admin account (created on first boot) |
| `ADMIN_PASSWORD` | No | Password for the auto-created admin account (min 6 chars) |
| `PORT` | No | API port — defaults to `3001`. Most platforms set this automatically |
| `NODE_ENV` | No | Set to `production` on live deployments |

---

## Deployment Guides

---

### Heroku

#### Option A — One-Click Deploy

Click the button at the top of this README. Heroku will prompt you to fill in your env vars and deploy automatically.

#### Option B — Manual via CLI

```bash
# 1. Login and create app
heroku login
heroku create your-app-name

# 2. Set environment variables
heroku config:set MONGO_URL="mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/cybersecpro"
heroku config:set JWT_SECRET="your_long_random_secret"
heroku config:set TELEGRAM_BOT_TOKEN="your_telegram_token"
heroku config:set ADMIN_EMAIL="admin@yourdomain.com"
heroku config:set ADMIN_PASSWORD="your_secure_password"
heroku config:set NODE_ENV="production"
heroku config:set NPM_CONFIG_LEGACY_PEER_DEPS="true"

# 3. Deploy
git push heroku main
```

#### Session persistence on Heroku

> Heroku's filesystem resets on every dyno restart. WhatsApp sessions in `nexstore/pairing/` will be lost.

For persistent sessions, use **Railway** or a **VPS** with a mounted volume. On Heroku, users simply re-pair after a dyno restart.

---

### Railway

Railway is recommended for persistent sessions — it supports native volumes and Node 20 out of the box.

#### Step 1 — Create project

[railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select your repo.

#### Step 2 — Set environment variables

Your service → **Variables** tab:

```
MONGO_URL             = mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/cybersecpro
JWT_SECRET            = your_long_random_secret
TELEGRAM_BOT_TOKEN    = your_telegram_token
ADMIN_EMAIL           = admin@yourdomain.com
ADMIN_PASSWORD        = your_secure_password
NODE_ENV              = production
NPM_CONFIG_LEGACY_PEER_DEPS = true
NIXPACKS_NODE_VERSION = 20
```

#### Step 3 — Add persistent volume (required for sessions)

Your service → **Settings** → **Volumes** → **Add Volume**:

| Field | Value |
|---|---|
| Mount Path | `/app/nexstore` |
| Size | 1 GB |

Railway auto-detects `railway.toml` in the repo for build and start commands.

---

### Render

#### Step 1 — Create Web Service

[render.com](https://render.com) → **New** → **Web Service** → connect your repo.

Render auto-detects `render.yaml` in the repo. If setting manually:

| Setting | Value |
|---|---|
| Build Command | `npm install --legacy-peer-deps && npm run build` |
| Start Command | `node server/index.js` |
| Instance Type | Starter (512 MB RAM minimum) |

#### Step 2 — Add persistent disk (required for sessions)

Your web service → **Disks** → **Add Disk**:

| Field | Value |
|---|---|
| Mount Path | `/opt/render/project/src/nexstore` |
| Size | 1 GB |

#### Step 3 — Environment variables

In your service → **Environment** tab:

```
MONGO_URL             = mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/cybersecpro
JWT_SECRET            = your_long_random_secret
TELEGRAM_BOT_TOKEN    = your_telegram_token
ADMIN_EMAIL           = admin@yourdomain.com
ADMIN_PASSWORD        = your_secure_password
NODE_ENV              = production
NPM_CONFIG_LEGACY_PEER_DEPS = true
```

---

### VPS (Ubuntu / Debian)

#### Step 1 — Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # must show v20.x.x
```

#### Step 2 — Clone and install

```bash
cd /var/www
git clone https://github.com/mrfr8nk/cybersec
cd cybersec
npm install --legacy-peer-deps
cd server && npm install && cd ..
cd client && npm install && npm run build && cd ..
```

#### Step 3 — Create .env

```bash
nano .env
```

```env
MONGO_URL=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/cybersecpro
JWT_SECRET=replace_with_very_long_random_string
TELEGRAM_BOT_TOKEN=your_telegram_token
NODE_ENV=production
PORT=3001
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_password
```

#### Step 4 — Run with PM2

```bash
sudo npm install -g pm2
pm2 start server/index.js --name cybersecpro
pm2 save && pm2 startup
```

#### Step 5 — Nginx reverse proxy

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/cybersecpro
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    proxy_read_timeout    60s;
    proxy_connect_timeout 60s;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        keep-alive;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cybersecpro /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com   # free HTTPS via Let's Encrypt
```

---

## Admin Access

### Method 1 — Environment variables (recommended)

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before first boot. The admin account is created automatically on startup. Log in at `/login` with those credentials.

### Method 2 — Promote an existing user

Open a shell on your platform (Heroku → **More** → **Run console**, Railway → **Shell** tab, or your VPS terminal):

```bash
node -e "
require('dotenv').config();
const { initDb } = require('./server/db');
const svc = require('./server/db-service');
initDb().then(async () => {
  const user = await svc.findUserByEmail('user@example.com');
  if (!user) return console.log('User not found');
  await svc.setAdminRole(user.id);
  console.log('Admin role granted to', user.email);
  process.exit(0);
});
"
```

---

## Post-Deployment Checklist

- [ ] `GET /api/health` returns `{ "status": "CYBERSECPRO API Online", "db": "MongoDB" }`
- [ ] Logs show `✅ MongoDB connected`
- [ ] Logs show `✅ Admin account created` or `✅ Admin role granted` (if env vars were set)
- [ ] Logs show `🔄 Sessions restored: X/X` ~5 seconds after boot
- [ ] Sign up at `/signup` and log in — dashboard loads correctly
- [ ] Link a WhatsApp number — enter number with country code, no `+` (e.g. `263776046121`)
- [ ] Enter the pairing code on your phone → **Linked Devices** → **Link a Device**
- [ ] Bot sends a welcome message after linking
- [ ] Restart the service — bot reconnects without re-pairing (requires persistent volume)

---

## Troubleshooting

### `Cannot find module '@whiskeysockets/baileys'`

Ensure Node.js 20 is being used and run:
```bash
npm install --legacy-peer-deps
```
If on Railway/Render, set `NIXPACKS_NODE_VERSION=20` in environment variables.

### Pairing code never arrives

1. Enter number with country code, no `+`, no spaces (e.g. `263776046121`)
2. If behind Nginx, ensure `proxy_read_timeout 60s` — the request can take up to 40 seconds
3. WhatsApp may rate-limit — wait 2 minutes and retry

### Sessions lost after restart

Mount a persistent volume at `nexstore/` (see each platform's guide above). On Heroku, ephemeral storage means sessions are lost on dyno restart — use Railway or a VPS for persistent sessions.

### Frontend shows blank page

Build the React app first:
```bash
cd client && npm install && npm run build
```
The built files go to `client/dist/` — Express serves them automatically when that folder exists.

### MongoDB connection error

Test your connection string:
```bash
node -e "require('dotenv').config(); const m=require('mongoose'); m.connect(process.env.MONGO_URL).then(()=>{ console.log('MongoDB OK'); process.exit(0); }).catch(e=>{ console.error(e.message); process.exit(1); })"
```

### `FATAL ERROR: Reached heap limit`

Minimum 512 MB RAM required. Add swap on a VPS:
```bash
sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Credits

- Telegram: [@namelesztech](https://t.me/namelesztech)
- Developer: [@DIGITALCYBER24](https://t.me/DIGITALCYBER24)

# CyberSecPro — WhatsApp Bot Management SaaS

A full-stack SaaS platform where users sign up, link their WhatsApp numbers via pairing codes, and manage their bot sessions through a cyberpunk-themed web dashboard.

---

## One-Click Heroku Deploy

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/mrfr8nk/cybersec)

The button above opens the Heroku deploy page for **github.com/mrfr8nk/cybersec**.  
Heroku will prompt you to fill in the environment variables defined in `app.json`.  
A free PostgreSQL database is automatically provisioned — no setup needed if you skip `MONGO_URL`.

---

## Table of Contents

- [Architecture](#architecture)
- [Database Options](#database-options)
- [Environment Variables](#environment-variables)
- [Deployment Guides](#deployment-guides)
  - [Heroku (Website / Button)](#heroku-website--button)
  - [Railway](#railway)
  - [Render](#render)
  - [VPS (Ubuntu / Debian)](#vps-ubuntu--debian)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Making a User an Admin](#making-a-user-an-admin)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  CyberSecPro                     │
│                                                  │
│  ┌───────────────┐     ┌────────────────────────┐│
│  │ React + Vite  │────▶│  Express.js API        ││
│  │  (Frontend)   │/api │  server/index.js       ││
│  └───────────────┘     │  Port: $PORT (3001)    ││
│                        └──────────┬─────────────┘│
│                                   │              │
│                     ┌─────────────▼────────────┐ │
│                     │   server/db-service.js   │ │
│                     │   (unified DB adapter)   │ │
│                     └──────┬──────────┬────────┘ │
│                            │          │           │
│                  ┌─────────▼──┐  ┌────▼─────────┐│
│                  │  MongoDB   │  │  PostgreSQL  ││
│                  │ (Mongoose) │  │    (pg)      ││
│                  └────────────┘  └─────────────┘│
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │  pair.js  (Baileys — WhatsApp sessions)      ││
│  │  Session files → nexstore/pairing/           ││
│  │  Auto-reconnects on every server restart     ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

**Key facts:**
- Node.js **20+** required — Baileys will not work on Node 18
- The app works with **MongoDB OR PostgreSQL** — set one, the other is ignored
- WhatsApp session files live in `nexstore/pairing/` — needs persistent storage on cloud platforms
- The Express backend serves the compiled React frontend as static files in production
- Admin account is created automatically on first boot using `ADMIN_EMAIL` + `ADMIN_PASSWORD`

---

## Database Options

The app auto-detects which database to use at startup — in this priority order:

| Priority | Variable | DB used |
|---|---|---|
| 1 | `MONGO_URL` is set | MongoDB (Mongoose) |
| 2 | `DATABASE_URL` is set | PostgreSQL (pg) |
| 3 | Neither is set | Built-in Replit PostgreSQL fallback *(only works on Replit)* |

You only need **one** database. On Heroku, the free PostgreSQL addon is automatically provisioned by `app.json` so `DATABASE_URL` is always available even if you skip `MONGO_URL`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | No | MongoDB connection string — e.g. `mongodb+srv://user:pass@cluster.mongodb.net/cybersecpro`. Get a free cluster at **mongodb.com/atlas**. If not set, PostgreSQL is used. |
| `DATABASE_URL` | No | PostgreSQL connection string. Auto-injected on Heroku (via addon) and Railway. |
| `JWT_SECRET` | **Yes** | Random string for signing JWT tokens. Heroku auto-generates this via `app.json`. Generate manually: `openssl rand -hex 64` |
| `ADMIN_EMAIL` | No | Email for the auto-created admin account. Created on first boot if it doesn't exist. |
| `ADMIN_PASSWORD` | No | Password for the auto-created admin account (min 6 chars). |
| `PORT` | No | API port. Defaults to `3001`. Most platforms set this automatically. |
| `NODE_ENV` | No | Set to `production` on live deployments. |

---

## Deployment Guides

---

### Heroku (Website / Button)

This is the easiest option — no CLI needed.

#### Option A — One-Click Deploy Button

Click the button at the top of this README:

**[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/mrfr8nk/cybersec)**

Heroku will:
1. Fork/clone the repo from `github.com/mrfr8nk/cybersec`
2. Show you a form to fill in env vars (JWT_SECRET is auto-generated)
3. Provision a free PostgreSQL database automatically
4. Build and deploy the app

#### Option B — Manual deploy via Heroku Dashboard

1. Go to [dashboard.heroku.com](https://dashboard.heroku.com) → **New** → **Create new app**
2. Give it a name (e.g. `cybersecpro-myname`) and click **Create app**
3. In the **Deploy** tab → **Deployment method** → **GitHub**
4. Connect your GitHub account and search for `cybersec`
5. Click **Connect** next to the repo
6. Scroll down to **Manual deploy** → select `main` branch → **Deploy Branch**

##### Add PostgreSQL (if not using MongoDB)

In your app → **Resources** tab → **Add-ons** → search for **Heroku Postgres** → select **Essential 0** (free) → click **Submit Order Form**.

This automatically sets `DATABASE_URL`.

##### Add environment variables

In your app → **Settings** tab → **Config Vars** → **Reveal Config Vars**:

```
JWT_SECRET    = (generate with: openssl rand -hex 64)
NODE_ENV      = production
ADMIN_EMAIL   = admin@yourdomain.com
ADMIN_PASSWORD= your_secure_password

# Optional — use MongoDB instead of PostgreSQL:
MONGO_URL     = mongodb+srv://user:pass@cluster.mongodb.net/cybersecpro
```

##### Add Node 20 buildpack

In **Settings** → **Buildpacks** → **Add buildpack** → select **heroku/nodejs** → **Save**.

Also ensure `package.json` has:
```json
"engines": { "node": "20.x" }
```

##### Enable automatic deploys (optional)

In the **Deploy** tab → **Automatic deploys** → **Enable Automatic Deploys**.  
Every push to `main` will redeploy automatically.

##### Session persistence on Heroku

> **Important:** Heroku's filesystem is wiped on every dyno restart. WhatsApp sessions in `nexstore/pairing/` will be lost.

Options:
- **Heroku Managed Data** — contact Heroku support for a persistent volume
- **Use MongoDB** — set `MONGO_URL` to a MongoDB Atlas cluster. The session *metadata* is tracked in MongoDB; the actual Baileys credential files still need a volume. For most use cases, users simply re-pair after a dyno restart (which happens ~daily on free/basic dynos)
- **Upgrade to Standard dynos** — Standard dynos have persistent filesystem within a single dyno (though still reset on deploy)

For production use with persistent sessions, **Railway** or a **VPS** is recommended.

---

### Railway

Railway is recommended for persistent sessions — it has native volumes, PostgreSQL, and Node 20 by default.

#### Step 1 — Create project from GitHub

[railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select `cybersec`.

#### Step 2 — Add PostgreSQL (skip if using MongoDB)

Inside your project → **+ New** → **Database** → **Add PostgreSQL**.  
`DATABASE_URL` is injected automatically.

#### Step 3 — Add a persistent volume (required for sessions)

Your service → **Settings** → **Volumes** → **Add Volume**:

| Field | Value |
|---|---|
| Mount path | `/app/nexstore` |
| Size | 1 GB |

#### Step 4 — Set environment variables

Your service → **Variables**:

```
JWT_SECRET    = (long random string)
NODE_ENV      = production
ADMIN_EMAIL   = admin@yourdomain.com
ADMIN_PASSWORD= your_secure_password

# Optional MongoDB:
MONGO_URL     = mongodb+srv://...
```

#### Step 5 — Pin Node.js to version 20

Add `.nvmrc` at the repo root:
```
20
```

Or in Railway variables:
```
NIXPACKS_NODE_VERSION = 20
```

#### Step 6 — Set build + start commands

**Build Command:**
```
npm install && cd client && npm install && npm run build && cd ..
```
**Start Command:**
```
node server/index.js
```

---

### Render

#### Step 1 — Create Web Service

[render.com](https://render.com) → **New** → **Web Service** → connect `cybersec` repo.

| Setting | Value |
|---|---|
| Build Command | `npm install && cd client && npm install && npm run build && cd ..` |
| Start Command | `node server/index.js` |
| Instance Type | Starter (512 MB RAM minimum) |

#### Step 2 — Add PostgreSQL (skip if using MongoDB)

**New** → **PostgreSQL** → copy **Internal Database URL** → paste as `DATABASE_URL` in your web service env.

#### Step 3 — Add persistent disk (required for sessions)

Your web service → **Disks** → **Add Disk**:

| Field | Value |
|---|---|
| Mount Path | `/opt/render/project/src/nexstore` |
| Size | 1 GB |

#### Step 4 — Environment variables

```
JWT_SECRET    = (long random string)
NODE_ENV      = production
ADMIN_EMAIL   = admin@yourdomain.com
ADMIN_PASSWORD= your_secure_password
```

#### Step 5 — Pin Node version

Add `.node-version` at repo root:
```
20.11.0
```

---

### VPS (Ubuntu / Debian)

#### Step 1 — Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # must show v20.x.x
```

#### Step 2 — Install PostgreSQL (skip if using MongoDB)

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo -u postgres psql <<'SQL'
CREATE USER cybersecpro WITH PASSWORD 'strong_password';
CREATE DATABASE cybersecpro OWNER cybersecpro;
SQL
```

#### Step 3 — Clone and install

```bash
cd /var/www
git clone https://github.com/mrfr8nk/cybersec
cd cybersec
npm install
cd server && npm install && cd ..
cd client && npm install && npm run build && cd ..
```

#### Step 4 — Create .env

```bash
nano .env
```

```env
# Choose ONE database:
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/cybersecpro
# OR:
DATABASE_URL=postgresql://cybersecpro:strong_password@localhost:5432/cybersecpro

JWT_SECRET=replace_with_very_long_random_string
NODE_ENV=production
PORT=3001
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_secure_password
```

#### Step 5 — Run with PM2

```bash
sudo npm install -g pm2
pm2 start server/index.js --name cybersecpro
pm2 save && pm2 startup
```

#### Step 6 — Nginx reverse proxy

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
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cybersecpro /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com   # free HTTPS
```

---

## Post-Deployment Checklist

- [ ] `GET /api/health` returns `{ "status": "CYBERSECPRO API Online", "db": "MongoDB" }` or `"db": "PostgreSQL"`
- [ ] Logs show `✅ PostgreSQL tables ready` or `✅ MongoDB connected`
- [ ] If `ADMIN_EMAIL`+`ADMIN_PASSWORD` were set, logs show `✅ Admin account created: ...`
- [ ] Logs show `🔄 Sessions restored: X/X` ~5 seconds after boot
- [ ] Sign up for a test account at `/signup`
- [ ] Log in — dashboard loads correctly
- [ ] Link a WhatsApp number — enter number (country code, no `+`), paste pairing code on phone
- [ ] Bot sends welcome message after linking
- [ ] Restart the service — bot reconnects without re-pairing (requires persistent volume/disk)

---

## Making a User an Admin

### Method 1 — Environment variable (recommended)

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before first boot. The admin account is created (or promoted) automatically.

### Method 2 — Shell command

Open a shell in your platform's dashboard (Heroku → **More** → **Run console**, Railway → **Shell** tab):

```bash
node -e "
require('dotenv').config();
const svc = require('./server/db-service');
const { initDb } = require('./server/db');
initDb().then(async () => {
  await svc.setAdminRole('USER_ID_HERE');
  console.log('Done');
  process.exit(0);
});
"
```

Or promote by email:

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

## Troubleshooting

### `Cannot find module '@whiskeysockets/baileys'`

You are running Node.js 18 or below. Upgrade to Node 20:
```
NIXPACKS_NODE_VERSION=20   ← Railway
.nvmrc → "20"              ← Render / Railway
engines.node → "20.x"     ← package.json for Heroku
```

### Pairing code never arrives

1. Enter number with country code, no `+`, no spaces (e.g. `263776046121`)
2. If behind Nginx, ensure `proxy_read_timeout 60s` — the request can take up to 40 seconds
3. WhatsApp rate-limits — wait 2 minutes and retry

### Sessions lost after restart

`nexstore/pairing/` is on ephemeral storage. Mount a persistent volume/disk at that path (see each platform's guide). On Heroku, daily dyno restarts will clear sessions unless a persistent addon is used.

### Frontend shows blank page

Build the React app first:
```bash
cd client && npm install && npm run build
```
The built files go to `client/dist/` — Express serves them automatically if that folder exists.

### Database connection error

Test your connection:
```bash
# PostgreSQL
node -e "require('dotenv').config(); const {Pool}=require('./server/node_modules/pg'); new Pool({connectionString:process.env.DATABASE_URL}).query('SELECT NOW()').then(r=>console.log('OK',r.rows[0])).catch(e=>console.error(e.message))"

# MongoDB
node -e "require('dotenv').config(); const m=require('mongoose'); m.connect(process.env.MONGO_URL).then(()=>console.log('MongoDB OK')).catch(e=>console.error(e.message))"
```

### `FATAL ERROR: Reached heap limit`

Minimum RAM: **512 MB**. Add swap on VPS:
```bash
sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Credits

- Telegram: [@namelesztech](https://t.me/namelesztech)
- Web by [mr frank ofc](https://github.com/mrfr8nk)

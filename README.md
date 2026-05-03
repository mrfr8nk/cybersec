# CyberSecPro — WhatsApp Bot Management SaaS

A full-stack SaaS platform where users sign up, link their WhatsApp numbers via pairing codes, and manage their bot sessions through a cyberpunk-themed web dashboard.

---

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deployment Guides](#deployment-guides)
  - [Railway](#railway)
  - [Render](#render)
  - [Heroku](#heroku)
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
│                        ┌──────────▼─────────────┐│
│                        │     PostgreSQL DB       ││
│                        │  users                 ││
│                        │  linked_numbers         ││
│                        │  bot_sessions           ││
│                        └────────────────────────┘│
│                                                  │
│  ┌──────────────────────────────────────────────┐│
│  │  pair.js  (Baileys — WhatsApp sessions)      ││
│  │  Session files → nexstore/pairing/           ││
│  │  Auto-reconnects on every server restart     ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

**Key facts before you deploy:**

- Node.js **20 or later** is required — Baileys does not work on Node 18
- WhatsApp session files live in `nexstore/pairing/` — this directory **must be on persistent storage** or users will have to re-pair after every restart
- The Express backend can serve the compiled React frontend as static files in production
- PostgreSQL is required — the app exits immediately if `DATABASE_URL` is missing

---

## Prerequisites

| Requirement | Minimum version |
|---|---|
| Node.js | 20.x |
| npm | 9.x |
| PostgreSQL | 13+ |
| Git | any recent |

---

## Environment Variables

Configure these in your platform's secrets / environment panel — never commit them to Git.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | Full PostgreSQL connection string — `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | **Yes** | Random string for signing JWT tokens. Generate: `openssl rand -hex 64` |
| `PORT` | No | Port the API server binds to. Defaults to `3001`. Most platforms set this automatically. |
| `NODE_ENV` | No | Set to `production` on live deployments |

---

## Deployment Guides

---

### Railway

Railway is the recommended platform — it has native PostgreSQL, persistent volumes, and runs Node 20 by default.

#### Step 1 — Create a project from GitHub

Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select your repo.

#### Step 2 — Add PostgreSQL

Inside your project → **+ New** → **Database** → **Add PostgreSQL**.  
Railway automatically injects `DATABASE_URL` into your service — no manual copy needed.

#### Step 3 — Add a persistent volume (required for sessions)

Your service → **Settings** → **Volumes** → **Add Volume**:

| Field | Value |
|---|---|
| Mount path | `/app/nexstore` |
| Size | 1 GB |

Without this, WhatsApp session files are lost on every redeploy and users must re-pair.

#### Step 4 — Set environment variables

Your service → **Variables** → **Add Variable**:

```
JWT_SECRET   = your_long_random_string
NODE_ENV     = production
```

#### Step 5 — Pin Node.js to version 20

Add to the root `package.json` (already present, verify it is there):

```json
"engines": {
  "node": ">=20.0.0"
}
```

Or add a `.nvmrc` file at the root:

```
20
```

#### Step 6 — Set the build + start command

Your service → **Settings** → **Deploy**:

- **Build Command:**
  ```
  npm install && cd client && npm install && npm run build && cd ..
  ```
- **Start Command:**
  ```
  node server/index.js
  ```

#### Step 7 — Serve the React build from Express

Add the following block to `server/index.js` **after** all your `app.use('/api/...')` calls and **before** `initDb()`:

```js
const path = require('path');
const clientDist = path.join(__dirname, '../client/dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}
```

#### Step 8 — Deploy

Push to `main` — Railway deploys automatically on every push.  
Watch the build logs; a successful start prints:

```
✅ PostgreSQL tables ready
🚀 CYBERSECPRO API running on port XXXX
🔄 Sessions restored: X/X
```

---

### Render

#### Step 1 — Create a Web Service

[render.com](https://render.com) → **New** → **Web Service** → connect your repo.

| Setting | Value |
|---|---|
| Environment | Node |
| Branch | `main` |
| Build Command | `npm install && cd client && npm install && npm run build && cd ..` |
| Start Command | `node server/index.js` |
| Instance Type | Starter (512 MB RAM minimum) |

#### Step 2 — Add PostgreSQL

**New** → **PostgreSQL** → create a database.  
In your web service → **Environment** → add:

```
DATABASE_URL = <paste Internal Database URL from the PostgreSQL service>
```

#### Step 3 — Add a persistent disk (required for sessions)

Your web service → **Disks** → **Add Disk**:

| Field | Value |
|---|---|
| Name | sessions |
| Mount Path | `/opt/render/project/src/nexstore` |
| Size | 1 GB |

#### Step 4 — Set environment variables

Your web service → **Environment**:

```
JWT_SECRET  = your_long_random_string
NODE_ENV    = production
```

#### Step 5 — Pin Node version

Add a `.node-version` file at the repo root:

```
20.11.0
```

#### Step 6 — Serve the React build from Express

Same as Railway Step 7 above — add the static file serving block to `server/index.js`.

#### Step 7 — Deploy

Click **Create Web Service**. Render builds and deploys automatically.

---

### Heroku

> **Note:** Heroku's filesystem is **ephemeral** — files written to disk are wiped on every dyno restart. This is a serious limitation for WhatsApp sessions. See Step 5 for options. If persistent sessions are a priority, use Railway or a VPS instead.

#### Step 1 — Install Heroku CLI and create an app

```bash
npm install -g heroku
heroku login
heroku create your-cybersecpro-app
```

#### Step 2 — Add PostgreSQL

```bash
heroku addons:create heroku-postgresql:essential-0
# DATABASE_URL is set automatically
```

#### Step 3 — Set environment variables

```bash
heroku config:set JWT_SECRET="your_long_random_string"
heroku config:set NODE_ENV=production
heroku config:set NPM_CONFIG_PRODUCTION=false
```

#### Step 4 — Set Node version

Ensure `package.json` at the root has:

```json
"engines": {
  "node": "20.x",
  "npm":  "9.x"
}
```

#### Step 5 — Handle session persistence

Since the Heroku filesystem is wiped on restart, choose one of these options:

**Option A — Heroku Managed Data (paid)**  
Contact Heroku support for a persistent volume addon and mount it at `nexstore`.

**Option B — Use an external object store**  
Replace Baileys' `useMultiFileAuthState` with a custom implementation that reads/writes credentials to AWS S3, Cloudflare R2, or similar. This is the recommended long-term approach for Heroku.

**Option C — Switch platform**  
Railway and Render both offer free-tier persistent disks. Switching takes under 10 minutes.

#### Step 6 — Create a Procfile

Create a file named `Procfile` at the repo root:

```
web: cd client && npm install && npm run build && cd .. && node server/index.js
```

#### Step 7 — Serve the React build from Express

Same as Railway Step 7 — add the static file serving block to `server/index.js`.

#### Step 8 — Deploy

```bash
git add .
git commit -m "production setup"
git push heroku main
```

View logs:

```bash
heroku logs --tail
```

---

### VPS (Ubuntu / Debian)

A VPS gives you full control, a persistent filesystem, and no cold-start delays.

#### Step 1 — Update and install Node.js 20

```bash
sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v    # must print v20.x.x
```

#### Step 2 — Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

sudo -u postgres psql <<'SQL'
CREATE USER cybersecpro WITH PASSWORD 'strong_password_here';
CREATE DATABASE cybersecpro OWNER cybersecpro;
GRANT ALL PRIVILEGES ON DATABASE cybersecpro TO cybersecpro;
\q
SQL
```

#### Step 3 — Clone the repo

```bash
cd /var/www
sudo git clone https://github.com/youruser/cybersecpro.git
sudo chown -R $USER:$USER cybersecpro
cd cybersecpro
```

#### Step 4 — Install dependencies and build

```bash
# Root dependencies (Baileys, bot utilities)
npm install

# Backend
cd server && npm install && cd ..

# Frontend — build for production
cd client && npm install && npm run build && cd ..
```

#### Step 5 — Create .env file

```bash
nano .env
```

```env
DATABASE_URL=postgresql://cybersecpro:strong_password_here@localhost:5432/cybersecpro
JWT_SECRET=replace_with_a_very_long_random_string
NODE_ENV=production
PORT=3001
```

Lock down the file:

```bash
chmod 600 .env
```

#### Step 6 — Serve the React build from Express

Add to `server/index.js` after all `app.use('/api/...')` calls:

```js
const path = require('path');
const clientDist = path.join(__dirname, '../client/dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}
```

#### Step 7 — Run with PM2

```bash
sudo npm install -g pm2

pm2 start server/index.js --name cybersecpro-api
pm2 save
pm2 startup    # run the printed command to enable auto-start on reboot
```

Useful PM2 commands:

```bash
pm2 logs cybersecpro-api     # live logs
pm2 restart cybersecpro-api  # restart
pm2 status                   # check running status
```

#### Step 8 — Configure Nginx as a reverse proxy

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/cybersecpro
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Pairing requests can take up to 40 seconds — increase timeouts
    proxy_read_timeout    60s;
    proxy_connect_timeout 60s;
    proxy_send_timeout    60s;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        'upgrade';
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/cybersecpro /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

#### Step 9 — Enable HTTPS (free with Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl reload nginx
```

Certificates renew automatically every 90 days.

---

## Post-Deployment Checklist

Run through these after every fresh deployment:

- [ ] `GET /api/health` returns `{ "status": "CYBERSECPRO API Online" }`
- [ ] Server logs show `✅ PostgreSQL tables ready`
- [ ] Server logs show `🔄 Sessions restored: X/X` ~5 seconds after boot
- [ ] Sign up for a new account at `/signup`
- [ ] Log in and confirm the dashboard loads
- [ ] Link a WhatsApp number — enter number (country code, no `+`), paste pairing code on phone
- [ ] Confirm bot sends the welcome message after pairing
- [ ] Restart the service — bot should reconnect automatically without re-pairing

---

## Making a User an Admin

SSH into your server or open a shell in your platform's dashboard, then run from the project root:

```bash
node -e "
require('dotenv').config();
const { Pool } = require('./server/node_modules/pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\"UPDATE users SET role = 'admin' WHERE email = 'your@email.com'\")
  .then(() => { console.log('Admin role granted.'); process.exit(0); })
  .catch(err => { console.error(err.message); process.exit(1); });
"
```

---

## Troubleshooting

### `Cannot find module '@whiskeysockets/baileys'`

You are running Node.js 18 or below. Upgrade to Node 20:

```bash
node -v    # check current version
```

On Railway/Render, set `NIXPACKS_NODE_VERSION=20` or add `.nvmrc` with value `20`.  
On VPS, reinstall Node using the NodeSource script in Step 1 of the VPS guide.

---

### Pairing code never arrives / request times out

1. Check logs for `[Pairing]` prefixed errors
2. Enter the number with country code only — no `+`, no spaces, no dashes (e.g. `263776046121`)
3. Confirm `nexstore/pairing/` exists and is writable (`ls -la nexstore/`)
4. WhatsApp rate-limits code requests — wait 2 minutes and try again
5. If running behind Nginx, ensure `proxy_read_timeout` is at least `60s`

---

### Sessions lost after every restart / redeploy

`nexstore/pairing/` is on ephemeral storage. Symptoms: users must re-pair after every restart.

- **Railway** — add a Volume mounted at `/app/nexstore`
- **Render** — add a Disk mounted at `/opt/render/project/src/nexstore`
- **Heroku** — switch to Railway/Render or implement S3-backed session storage
- **VPS** — the local filesystem is already persistent; no action needed

---

### App crashes with `Reached heap limit` / out of memory

Minimum recommended RAM is **512 MB**. With multiple active WhatsApp sessions, 1 GB is safer.

Add swap on a VPS to give breathing room:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

### Database connection refused

Test the connection directly:

```bash
node -e "
require('dotenv').config();
const { Pool } = require('./server/node_modules/pg');
new Pool({ connectionString: process.env.DATABASE_URL })
  .query('SELECT NOW()')
  .then(r => console.log('Connected:', r.rows[0].now))
  .catch(e => console.error('Failed:', e.message));
"
```

Common causes: wrong `DATABASE_URL`, PostgreSQL not running, firewall blocking port 5432.

---

### Frontend shows a blank white page

The React app has not been built. Run:

```bash
cd client && npm install && npm run build
```

Then confirm Express is serving `client/dist` — see the "Serve the React build from Express" step in your platform guide.

---

## Credits

- Telegram: [@namelesztech](https://t.me/namelesztech)
- Web by [mr frank ofc](https://github.com/mrfr8nk)

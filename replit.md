# CYBERSECPRO — Futuristic Cyberpunk SaaS Platform

## What this project is
A full-stack futuristic cyberpunk SaaS web application. Features holographic UI, bot number management, JWT authentication, admin dashboard, and PostgreSQL database (Replit built-in).

## Project Structure
```
/
├── client/         # React + Vite frontend (port 5000)
│   ├── src/
│   │   ├── pages/          # Landing, Login, Signup, Dashboard, Admin
│   │   ├── contexts/       # AuthContext (JWT)
│   │   └── index.css       # Cyberpunk neon styles (deep blue theme)
│   ├── vite.config.js      # Proxy /api → port 3001
│   └── tailwind.config.js
├── server/         # Express.js backend (port 3001)
│   ├── db.js               # PostgreSQL connection + table init
│   ├── routes/             # auth, user, numbers, admin
│   ├── middleware/         # auth.js (JWT protect/adminOnly)
│   └── index.js            # Entry point
```

## Running the Project
- **Frontend** workflow: `cd client && npx vite --port 5000 --host 0.0.0.0` → port 5000
- **Backend API** workflow: `node server/index.js` → port 3001
- Frontend proxies all `/api/*` calls to backend via Vite proxy

## Database
- Uses Replit's built-in **PostgreSQL** (DATABASE_URL secret — automatically available)
- Tables created automatically on startup: `users`, `linked_numbers`, `bot_sessions`
- `bot_sessions` tracks each WhatsApp number's connect/disconnect state in real-time
- No external database needed

## Bot Session Persistence
- On every server restart, `autoload.js` scans `nexstore/pairing/` for valid session directories
- All found sessions are reconnected automatically (batched, 3 at a time, 5-second boot delay)
- `pair.js` calls `session-db.js` to mark sessions `active` on connect, `inactive` on logout/error
- `session-db.js` is a thin root-level pg client (reuses `server/node_modules/pg`)
- Works for both `263xxx@s.whatsapp.net` and plain `263xxx` directory formats

## Environment Variables
```
DATABASE_URL=...   # Auto-provided by Replit PostgreSQL
JWT_SECRET=...     # JWT signing secret (optional, has default)
PORT=3001          # Backend port (default)
```

## Tech Stack
- **Frontend**: React 18 + Vite, Tailwind CSS, Framer Motion, React Router, Axios
- **Backend**: Node.js + Express.js, pg (PostgreSQL), bcryptjs, jsonwebtoken
- **Database**: PostgreSQL via Replit built-in (DATABASE_URL)
- **Security**: Helmet, express-rate-limit, express-mongo-sanitize, JWT

## API Routes
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/signup | Public | Register user |
| POST | /api/auth/login | Public | Login + get JWT |
| GET | /api/user/profile | JWT | Get own profile |
| PUT | /api/user/profile | JWT | Update username |
| GET | /api/user/stats | JWT | Usage stats |
| GET | /api/numbers | JWT | List linked numbers |
| POST | /api/numbers | JWT | Link new number (plan limit enforced) |
| PUT | /api/numbers/:id/toggle | JWT | Toggle active/inactive |
| DELETE | /api/numbers/:id | JWT | Delete number |
| GET | /api/admin/stats | Admin | Global platform stats |
| GET | /api/admin/users | Admin | List all users |
| GET | /api/admin/numbers | Admin | List all numbers |
| PUT | /api/admin/users/:id/ban | Admin | Ban/unban user |
| DELETE | /api/admin/users/:id | Admin | Delete user |
| PUT | /api/admin/users/:id/plan | Admin | Change user plan |

## Plan Limits
- FREE: 5 linked numbers
- PRO: 25 linked numbers (contact +923417022212)
- ENTERPRISE: Unlimited (contact +923417022212)

## To Make Admin
Run in server directory:
```js
const { pool, initDb } = require('./db');
initDb().then(async () => {
  await pool.query("UPDATE users SET role = 'admin' WHERE email = 'your@email.com'");
  process.exit(0);
});
```

## UI Theme
- Deep blue/navy cyberpunk design (not pure black)
- Colors: Neon Cyan (#00f5ff), Electric Blue (#0080ff), Purple (#8b5cf6), Neon Pink (#ff00ff)
- Fonts: Orbitron (display), Share Tech Mono (code), Exo 2 (body)
- Mobile-responsive with hamburger menu

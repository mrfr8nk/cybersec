# CYBERSECPRO — Futuristic Cyberpunk SaaS Platform

## What this project is
A full-stack futuristic cyberpunk SaaS web application converted from a Telegram bot system. Features holographic UI, bot number management, JWT authentication, admin dashboard, and MongoDB database.

## Project Structure
```
/
├── client/         # React + Vite frontend (port 5000)
│   ├── src/
│   │   ├── pages/          # Landing, Login, Signup, Dashboard, Admin
│   │   ├── contexts/       # AuthContext (JWT)
│   │   └── index.css       # Cyberpunk neon styles
│   ├── vite.config.js      # Proxy /api → port 3001
│   └── tailwind.config.js
├── server/         # Express.js backend (port 3001)
│   ├── routes/             # auth, user, numbers, admin
│   ├── models/             # User, LinkedNumber (Mongoose)
│   ├── middleware/         # auth.js (JWT protect/adminOnly)
│   └── index.js            # Entry point
└── start-dev.sh    # Starts both services
```

## Running the Project
- **Frontend** workflow: `cd client && npx vite --port 5000 --host 0.0.0.0` → port 5000
- **Backend API** workflow: `node server/index.js` → port 3001
- Frontend proxies all `/api/*` calls to backend via Vite proxy

## Environment Variables
```
MONGODB_URI=mongodb://...  # MongoDB connection string
JWT_SECRET=your_secret     # JWT signing secret
PORT=3001                  # Backend port (default)
CLIENT_URL=...             # Frontend URL for CORS
```

## Tech Stack
- **Frontend**: React 18 + Vite, Tailwind CSS, Framer Motion, React Router, Axios
- **Backend**: Node.js + Express.js, Mongoose, bcryptjs, jsonwebtoken
- **Database**: MongoDB (via MONGODB_URI env var)
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
- PRO: 25 linked numbers
- ENTERPRISE: Unlimited

## UI Theme
- Cyberpunk holographic design
- Colors: Neon Cyan (#00f5ff), Electric Blue (#0080ff), Purple (#8b5cf6), Neon Pink (#ff00ff)
- Fonts: Orbitron (display), Share Tech Mono (code), Exo 2 (body)
- Effects: Matrix rain, HUD rings, glassmorphism, neon glow, particle background

## To Make Admin
Set a user's `role` field to `"admin"` directly in MongoDB.

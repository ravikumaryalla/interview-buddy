# Interview Buddy

A desktop AI assistant for coding interviews. Capture any problem from your screen, get instant solutions in multiple languages, chat with AI in real-time, and practice with a mock interview timer — all in a transparent, always-on-top overlay window.

---

## Architecture

```
interview-buddy/
├── src/                    # Electron renderer (React frontend)
├── electron/               # Electron main process
├── backend/                # Node.js / Express API server
│   ├── src/                # Backend source
│   ├── prisma/             # Database schema & migrations
│   └── admin-dashboard/    # React admin panel (separate Vite app)
```

The app has three runnable pieces:

| Piece | Tech | Port | Purpose |
|---|---|---|---|
| Electron app | React + Vite + Electron | — | Desktop overlay for users |
| Backend API | Express + Prisma + Redis | 3001 | Auth, credits, AI proxy |
| Admin dashboard | React + Vite | 5174 | Admin control panel |

---

## Features

### Electron App (User-facing)
- **Screen capture** — select any region of your screen with `Ctrl+Shift+S`
- **OCR extraction** — Tesseract.js extracts problem text from screenshots
- **AI problem solver** — generates solutions in JavaScript, Python, and Java with time/space complexity
- **Chat assistant** — voice or text chat with context-aware AI
- **Live voice mode** — real-time bidirectional voice conversation via OpenAI Realtime API
- **Mock interview timer** — configurable 15–60 minute countdown
- **History** — browse, reload, and export previous solutions as Markdown
- **Always-on-top overlay** — transparent, adjustable opacity, frameless window
- **Auth** — login/register screen backed by the API server
- **Credits** — balance shown in the tab bar; each AI feature costs credits

### Backend API
- JWT authentication with refresh tokens
- Credit system — admin manually grants credits; each AI call deducts credits
- AI proxy — all OpenAI calls go through the server (API key never exposed to clients)
- Admin routes — stats, user management, credit adjustment, usage logs

### Admin Dashboard
- Overview stats (users, credits consumed, feature breakdown)
- User management — search, filter, ban/unban
- Manual credit adjustment with reason tracking
- System-wide usage logs with feature filter
- Credits issued over time chart

---

## Prerequisites

- Node.js 18+
- pnpm (for Electron app) — `npm install -g pnpm`
- npm (for backend + admin dashboard)
- PostgreSQL database (Neon or local)
- Redis instance (local or Upstash)
- OpenAI API key

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd interview-buddy

# Electron app dependencies
pnpm install

# Backend dependencies
cd backend && npm install

# Admin dashboard dependencies
cd backend/admin-dashboard && npm install
```

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL="postgresql://..."     # Your Neon or local Postgres URL
REDIS_URL="redis://localhost:6379"
JWT_SECRET="..."                    # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_REFRESH_SECRET="..."            # Same command, run again for a different value
OPENAI_API_KEY="sk-proj-..."
SMTP_HOST="smtp.mailtrap.io"        # Mailtrap for dev, real SMTP for prod
SMTP_USER="..."
SMTP_PASS="..."
```

### 3. Set up the database

```bash
cd backend
npm run db:push       # Push schema to your database
npm run db:generate   # Generate Prisma client
```

### 4. Frontend environment

The `.env` at the project root already points to the local backend:

```env
VITE_API_URL=http://localhost:3001
```

Change this URL if your backend runs elsewhere (e.g. a deployed server).

### 5. Run everything

Open three terminals:

```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Admin dashboard
cd backend/admin-dashboard && npm run dev

# Terminal 3 — Electron app
pnpm electron:dev
```

---

## First-time setup

### Promote yourself to admin

1. Register an account in the Electron app
2. Open Prisma Studio:
   ```bash
   cd backend && npm run db:studio
   ```
3. Find your user row → change `role` from `USER` to `ADMIN`
4. Log in to the admin dashboard at `http://localhost:5174`

### Grant credits to a user

From the admin dashboard — **Users → User Detail → Adjust Credits** — enter an amount and reason.

Or via curl:
```bash
curl -X PUT http://localhost:3001/api/admin/users/<userId>/credits \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "reason": "Welcome grant"}'
```

---

## Credit costs

| Feature | Credits |
|---|---|
| Solve problem (standard model) | 5 |
| Solve problem (reasoning model) | 15 |
| Chat message | 2 |
| Audio transcription | 3 |
| Realtime voice session | 10 |

New users receive **20 free credits** on signup (set via `FREE_CREDITS_ON_SIGNUP` in `.env`).

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+S` | Capture screen area |
| `Ctrl+Shift+A` | Toggle window visibility |
| `Ctrl+↑` | Increase window opacity |
| `Ctrl+↓` | Decrease window opacity |

---

## Supported AI models

| Model | Type | Solve cost |
|---|---|---|
| GPT-4o | Standard | 5 credits |
| GPT-4o Mini | Standard | 5 credits |
| GPT-4.1 | Standard | 5 credits |
| GPT-4.1 Mini | Standard | 5 credits |
| o4-mini | Reasoning | 15 credits |
| o3 | Reasoning | 15 credits |
| o1 | Reasoning | 15 credits |

---

## Tech stack

**Electron app**
- React 19, TypeScript, Vite 8, Electron 41
- Zustand (state), TailwindCSS 4
- Tesseract.js (OCR), OpenAI SDK, electron-store

**Backend**
- Express 4, TypeScript, Node.js
- Prisma ORM + PostgreSQL (Neon-compatible)
- Redis (ioredis) — token blacklist & refresh token store
- JWT + bcryptjs — authentication
- Nodemailer — password reset emails
- Zod — request validation, Multer — audio file uploads

**Admin Dashboard**
- React 19, TypeScript, Vite, TailwindCSS 4
- React Router, Recharts (charts), Zustand, Axios

---

## Project structure

```
src/
├── lib/
│   ├── api.ts           # Backend HTTP client (JWT-aware fetch wrapper)
│   └── ai.ts            # AI function wrappers (solve, chat, transcribe, realtime)
├── store/
│   └── useAppStore.ts   # Global Zustand store (auth + settings + runtime state)
└── components/
    ├── AuthScreen.tsx    # Login / register screen
    ├── ProblemSolver.tsx # AI solution display and solve button
    ├── VoiceInput.tsx    # Chat tab + Live voice tab
    ├── HistoryPanel.tsx  # Saved solutions browser
    ├── MockInterview.tsx # Interview countdown timer
    ├── SettingsPanel.tsx # User profile, credits, model config
    └── FloatingToolbar.tsx

backend/
├── src/
│   ├── routes/          # auth, user, billing, ai, admin
│   ├── services/        # openai, credits, email
│   ├── middleware/      # jwtGuard, adminOnly, requireCredits
│   └── lib/             # prisma client, redis client
└── prisma/
    └── schema.prisma

backend/admin-dashboard/
└── src/
    ├── pages/           # Login, Dashboard, Users, UserDetail, Logs
    ├── components/      # Sidebar, StatCard
    ├── store/           # useAuthStore
    └── lib/             # api (axios instance)
```

# DAWin — Deployment Guide

**Status: Current**
**Last updated: 2026-05-28**

---

## Architecture

DAWin has two independently deployed services:

| Service | Tech | Recommended host | Branch |
|---|---|---|---|
| Frontend | React/Vite | Vercel | `beta` (staging), `main` (production) |
| Backend | Fastify + WebSocket | Railway or Render | `beta` (staging), `main` (production) |

> **Why separate hosts?** Vercel uses serverless functions which terminate after ~30 seconds and cannot maintain persistent WebSocket connections. The Fastify backend requires a long-running Node.js process.

---

## Frontend deploy (Vercel)

### One-time setup
1. Connect the GitHub repo to Vercel
2. Set root directory to `/` (repo root)
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set environment variables in Vercel dashboard:
   - `VITE_API_URL` — URL of your deployed backend (e.g. `https://api.dawin.app`)
   - `VITE_WS_URL` — WebSocket URL of your deployed backend (e.g. `wss://api.dawin.app`)

The `vercel.json` at the repo root pre-configures the build settings. The `@dawin-api-url` and `@dawin-ws-url` references in `vercel.json` are Vercel environment variable references — you must create these in the Vercel dashboard before deploying.

### Auto-deploy
- `beta` branch → deploys to `beta.dawin.app` (or Vercel preview URL)
- `main` branch → deploys to production URL

---

## Backend deploy (Railway)

### One-time setup
1. Create a new Railway project
2. Connect the GitHub repo, set root to `server/`
3. Start command: `npm run start`
4. Set environment variables:
   - `DATABASE_URL` — PostgreSQL connection string (Railway can provision this)
   - `JWT_SECRET` — strong random secret (never reuse dev secret)
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
5. Create a separate service for the PostgreSQL database or use Railway's managed Postgres

### Auto-deploy
Railway auto-deploys from the connected branch on every push.

---

## Branch → environment mapping

| Branch | Frontend | Backend | Purpose |
|---|---|---|---|
| `feature/*` | No deploy | No deploy | Development |
| `beta` | Vercel beta deploy | Railway staging | Integration testing |
| `main` | Vercel production | Railway production | Live users |

---

## First deploy checklist

- [ ] `npm run build` succeeds locally
- [ ] `tsc --noEmit` passes (frontend + backend)
- [ ] `npm run test:run` passes (all unit tests green)
- [ ] `VITE_API_URL` and `VITE_WS_URL` set in Vercel dashboard
- [ ] Backend environment variables set in Railway
- [ ] Database migrations run: `npx prisma migrate deploy`
- [ ] R2 bucket created and credentials tested
- [ ] `beta` branch deploys successfully before merging to `main`

---

## Local development

See `docs/guides/local-setup.md` for full local environment setup.

The short version:
```bash
# Frontend
npm install
npm run dev          # starts at localhost:5173

# Backend
cd server
npm install
npm run start        # starts at localhost:3000
```

Copy `.env.example` to `.env` and fill in credentials before starting the backend.

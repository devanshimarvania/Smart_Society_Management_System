# Smart Society Management System

Full-stack MERN application: Node.js/Express/MongoDB backend +
React/Vite frontend. Covers Phases 1–11 of the project roadmap (Phase 12,
deployment, is not included).

## Quick Start

### 1. Backend
```bash
cd backend
npm install
# fill in backend/.env (JWT_SECRET, EMAIL_USER, EMAIL_PASS)
# make sure MongoDB is running locally (mongod)
npm run dev
```
Runs on `http://localhost:9000`.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`. Talks to the backend at
`http://localhost:9000/api` (hardcoded in `frontend/src/services/api.js`).

### 3. First-time setup flow
1. Open the frontend, go to **Register**, create the Admin account.
2. Log in as Admin.
3. Add Flats (`Admin → Flats`).
4. Add Residents (`Admin → Residents`) — this creates both the login
   account and links it to a flat in one step.
5. Add Security and Maintenance accounts the same way (use the "Admin
   creates account" pattern — see backend README for the raw API if you
   want to do this via cURL instead).
6. Log in as each role to explore their dashboard and modules.

## What's Included

- `backend/` — full Express/MongoDB API, 16 modules, JWT auth + RBAC,
  Nodemailer password reset, PDF/Excel reports. See `backend/README.md`
  for the full API reference.
- `frontend/` — full React/Vite app, 4 role-based dashboards, every CRUD
  module wired to the backend. See `frontend/README.md` for routing and
  page details.

## Verified Before Delivery

- Backend: all files pass `node --check`, server boots cleanly, every
  controller/model/route cross-reference resolves.
- Frontend: `npm run build` completes with zero errors (161 modules),
  `npm run dev` boots cleanly.

## Not Included

- **Phase 12 (Deployment)** — Vercel/Render/Atlas configuration.
- Production environment hardening (rate limiting, helmet, logging
  infrastructure) beyond what's already in the centralized error handler.

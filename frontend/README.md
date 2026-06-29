# Smart Society Management System — Frontend

React (Vite) frontend for the Smart Society Management System. Covers all 4
roles — Admin, Resident, Security, Maintenance — with role-aware routing,
dashboards, and module pages.

## Tech Stack

React 18 (Vite), Redux Toolkit, React Router DOM, Axios, React Hook Form,
Bootstrap 5 + Bootstrap Icons, Chart.js (via react-chartjs-2), React Toastify.

## Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Make sure the backend is running first
The frontend expects the backend at `http://localhost:9000/api`. Start the
backend (`cd ../backend && npm run dev`) before using the frontend.

### 3. Run the dev server
```bash
npm run dev
```
Opens at `http://localhost:5173`.

### 4. Build for production
```bash
npm run build
```
Output goes to `dist/`.

## How Login Works

- JWT is stored in `localStorage` under the key `"user"` (combined with the
  rest of the user object: `{ token, id, name, email, role, phone }`).
- Every API request automatically attaches `Authorization: Bearer <token>`
  via an axios interceptor (`src/services/api.js`).
- A `401` response anywhere logs the user out and redirects to `/login`.

## Folder Structure

```
frontend/
├── src/
│   ├── assets/
│   ├── components/        → Sidebar, Topbar, Modal, ConfirmDialog, Spinner,
│   │                         StatCard, StatusBadge (all shared/reusable)
│   ├── layouts/
│   │   └── DashboardLayout.jsx   → wraps Sidebar + Topbar + page content
│   ├── pages/              → one folder per module (see mapping below)
│   ├── redux/
│   │   ├── slices/          → authSlice, notificationSlice
│   │   └── store.js
│   ├── routes/
│   │   └── ProtectedRoute.jsx    → auth + role-based route guard
│   ├── services/            → one file per backend module, all axios calls
│   ├── chartSetup.js        → Chart.js component registration
│   ├── index.css            → dark sidebar, glassmorphism cards, design tokens
│   ├── App.jsx               → full route tree for all 4 roles
│   └── main.jsx
```

## Routes & Role Access

| Path prefix | Role | Dashboard | Notes |
|---|---|---|---|
| `/admin/*` | admin | Full stats + charts | Flats, Residents, Visitors, Complaints, Bills, Facilities, Bookings, Notices, Polls, Reports |
| `/resident/*` | resident | Personal stats | Profile (family/vehicles), Visitors (approve), Complaints (raise), Bills (view+invoice), Bookings (create), Notices (view), Polls (vote) |
| `/security/*` | security | Gate activity stats | Visitors (add entry, mark exit) |
| `/maintenance/*` | maintenance | Work queue stats | Complaints (update status, upload completion photos) |

Several pages are **shared components that adapt behavior by role** rather
than being duplicated:
- `VisitorsPage` — security adds/exits visitors; resident approves/rejects; admin views all
- `NoticesPage` — admin posts/edits/deletes; everyone else views
- `PollsPage` — admin creates/closes/deletes; resident votes; everyone views results
- `SettingsPage` — same profile view for every role

## Important Notes

- **No update-profile or change-password endpoint exists in the backend.**
  Settings page sends a password **reset email** (reusing the forgot-password
  flow) rather than an in-app password change form, since the backend has no
  endpoint for the latter.
- **A `GET /api/auth/users?role=` endpoint was added to the backend** during
  frontend development, since admin needed a way to list maintenance staff
  for complaint assignment and there was no listing endpoint. This is a
  small, deliberate addition to Phase 1's auth module — see the updated
  backend `authController.js` / `authRoutes.js`.
- **File uploads** (complaint images, visitor photos, facility images, notice
  attachments, family member photos) are sent as `multipart/form-data`. Look
  at the relevant service file (e.g. `complaintService.js`) for the exact
  field names expected by the backend.
- **Excel/PDF downloads** (`reportService.js`) use axios with
  `responseType: "blob"` and trigger a browser download via a temporary
  object URL — no server-side redirect is involved.

## Verified

- `npm install` completes cleanly.
- `npm run build` completes with zero errors (161 modules, only a benign
  chunk-size warning for the production bundle).
- `npm run dev` boots correctly on port 5173.

## Next Steps

Phase 12 (Deployment — Vercel for frontend, Render for backend, MongoDB
Atlas for the database) is the only remaining phase from the master spec.

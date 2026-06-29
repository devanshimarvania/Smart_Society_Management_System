# Smart Society Management System — Backend (Full)

Complete backend for the Smart Society Management System, covering Phases 1–11
of the project roadmap: Authentication, Resident Management, Visitor
Management, Complaint Management, Billing, Facility Booking, Notice Board,
Poll & Voting, Dashboard & Analytics, Notifications, and Reports (PDF/Excel).

## Folder Structure

```
backend/
├── config/
│   ├── db.js          → MongoDB connection
│   ├── mail.js        → Nodemailer (Gmail SMTP) config
│   └── multer.js      → File upload storage config
├── controllers/        → 16 controllers, one per module
├── middleware/
│   ├── auth.js          → JWT verification (protect)
│   ├── role.js          → Role-based access control (authorize)
│   ├── upload.js        → Multer wrapper with consistent error handling
│   └── errorHandler.js   → Centralized error handling + 404
├── models/              → 15 Mongoose models
├── routes/              → 16 route files, one per module
├── utils/
│   ├── generateToken.js   → JWT signing helper
│   ├── emailTemplates.js  → HTML email templates
│   └── notify.js          → In-app notification creation helper
├── uploads/             → Uploaded images/files (created automatically)
├── .env
├── .env.example
├── server.js
└── package.json
```

## Setup Steps

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Make sure MongoDB is running locally
```bash
mongod
```
Connects to `mongodb://localhost:27017/smart_society_db` by default.

### 3. Configure `.env`
Copy `.env.example` to `.env` (already done) and fill in your values —
especially `JWT_SECRET` and the Gmail `EMAIL_USER` / `EMAIL_PASS` (App
Password, not your normal Gmail password — see comments in `.env.example`).

### 4. Run the server
```bash
npm run dev
```

You should see:
```
Server running in development mode on port 9000
MongoDB Connected: localhost/smart_society_db
Nodemailer is ready to send emails.
```

## Roles

| Role          | How account is created                              |
|---------------|------------------------------------------------------|
| `admin`       | Self-registers via `/api/auth/register`               |
| `resident`    | Created by admin via `/api/auth/create-user`, then linked to a flat via `/api/residents` |
| `security`    | Created by admin via `/api/auth/create-user`           |
| `maintenance` | Created by admin via `/api/auth/create-user`           |

## Typical Setup Flow (first-time use)

1. Register the first Admin → `POST /api/auth/register`
2. Admin logs in → `POST /api/auth/login`
3. Admin creates Flats → `POST /api/flats`
4. Admin creates a Resident **user account** → `POST /api/auth/create-user` (role: `resident`)
5. Admin links that user to a flat as a **Resident profile** → `POST /api/residents`
6. Admin creates Security & Maintenance accounts the same way (step 2, different role)
7. From here, each role logs in and uses their respective endpoints

## Full API Reference

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register the Admin account |
| POST | `/login` | Public | Login (any role) |
| GET | `/me` | Private | Get own profile |
| POST | `/create-user` | Admin | Create resident/security/maintenance account |
| POST | `/forgot-password` | Public | Email password reset link |
| PUT | `/reset-password/:resetToken` | Public | Reset password |

### Flats — `/api/flats`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` | Admin |
| GET | `/` | Admin, Security |
| GET | `/:id` | Admin, Security, Resident |
| PUT | `/:id` | Admin |
| DELETE | `/:id` | Admin (only if vacant) |

### Residents — `/api/residents`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` | Admin (links a user to a flat) |
| GET | `/` | Admin, Security (supports `?search=&flat=&page=&limit=`) |
| GET | `/me` | Resident (own profile) |
| GET | `/:id` | Admin, Security, Resident (own only) |
| PUT | `/:id` | Admin |
| PUT | `/:id/reallocate-flat` | Admin |
| DELETE | `/:id` | Admin |

### Family Members — `/api/family-members`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` (multipart, field `photo`) | Admin, Resident |
| GET | `/me` | Resident |
| GET | `/resident/:residentId` | Admin, Security |
| PUT | `/:id` | Admin, Resident (own) |
| DELETE | `/:id` | Admin, Resident (own) |

### Vehicles — `/api/vehicles`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` | Admin, Resident |
| GET | `/` | Admin, Security (supports `?search=`) |
| GET | `/me` | Resident |
| GET | `/resident/:residentId` | Admin, Security |
| PUT | `/:id` | Admin, Resident (own) |
| DELETE | `/:id` | Admin, Resident (own) |

### Visitors — `/api/visitors`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` (multipart, field `photo`) | Security |
| GET | `/` | Admin, Security (filters: `status`, `approvalStatus`, `purpose`, `date`) |
| GET | `/pending-for-me` | Resident |
| GET | `/my-history` | Resident |
| GET | `/:id` | Admin, Security, Resident (own flat) |
| PUT | `/:id/approval` | Resident |
| PUT | `/:id/exit` | Security |

### Complaints — `/api/complaints`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` (multipart, field `images`, max 5) | Resident |
| GET | `/` | Admin (filters: `status`, `category`, `priority`, `assignedTo`) |
| GET | `/me` | Resident |
| GET | `/assigned-to-me` | Maintenance |
| GET | `/:id` | Admin, Resident (own), Maintenance (assigned) |
| PUT | `/:id/assign` | Admin |
| PUT | `/:id/status` (multipart, field `completionImages`) | Maintenance (assigned) |
| PUT | `/:id/close` | Admin |
| PUT | `/:id/reopen` | Resident (own) |
| DELETE | `/:id` | Admin |

### Bills — `/api/bills`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` | Admin (single flat) |
| POST | `/bulk-generate` | Admin (all occupied flats for a month) |
| POST | `/run-overdue-check` | Admin (batch-applies penalty to overdue bills) |
| GET | `/` | Admin |
| GET | `/me` | Resident |
| GET | `/:id` | Admin, Resident (own) |
| PUT | `/:id/apply-penalty` | Admin |
| DELETE | `/:id` | Admin (only if unpaid) |

### Payments — `/api/payments`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` | Admin (records a manual payment against a bill) |
| GET | `/` | Admin |
| GET | `/me` | Resident |

### Facilities — `/api/facilities`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` (multipart, field `image`) | Admin |
| GET | `/` | Any logged-in role |
| GET | `/:id` | Any logged-in role |
| PUT | `/:id` | Admin |
| DELETE | `/:id` | Admin |

### Bookings — `/api/bookings`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` | Resident |
| GET | `/` | Admin |
| GET | `/me` | Resident |
| PUT | `/:id/approval` | Admin |
| PUT | `/:id/cancel` | Resident (own) |

### Notices — `/api/notices`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` (multipart, field `attachment`) | Admin |
| GET | `/` | Any logged-in role |
| GET | `/:id` | Any logged-in role |
| PUT | `/:id` | Admin |
| DELETE | `/:id` | Admin |

### Polls — `/api/polls`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` | Admin |
| GET | `/` | Any logged-in role |
| GET | `/:id` | Any logged-in role (returns live results) |
| POST | `/:id/vote` | Resident |
| PUT | `/:id/close` | Admin |
| DELETE | `/:id` | Admin |

### Notifications — `/api/notifications`
| Method | Endpoint | Access |
|---|---|---|
| GET | `/` | Any logged-in role (own notifications, supports `?isRead=`) |
| PUT | `/mark-all-read` | Any logged-in role |
| PUT | `/:id/read` | Any logged-in role (own) |
| DELETE | `/:id` | Any logged-in role (own) |

### Dashboard — `/api/dashboard`
| Method | Endpoint | Access |
|---|---|---|
| GET | `/admin` | Admin (full stats, charts, recent activity) |
| GET | `/resident` | Resident (personal stats) |
| GET | `/security` | Security (gate activity stats) |
| GET | `/maintenance` | Maintenance (assigned work stats) |

### Reports — `/api/reports`
| Method | Endpoint | Access |
|---|---|---|
| GET | `/invoice/:billId` | Admin, Resident (own) — downloads a PDF invoice |
| GET | `/bills-excel?billMonth=2026-06` | Admin — downloads Excel of bills |
| GET | `/complaints-excel?status=completed` | Admin — downloads Excel of complaints |

## Key Design Notes

- **Resident vs User**: `User` is the login identity (email/password/role).
  `Resident` is a society-specific profile linking a `User` to a `Flat`,
  holding move-in/out dates, emergency contact, etc. A resident's `User`
  account is created first by the admin, then a `Resident` profile links
  them to their flat.
- **Auto-approval for visitors**: delivery/cab/service visitor entries are
  auto-approved since they don't typically need resident sign-off; guest
  visits require explicit resident approval.
- **Complaint timeline**: every status change (raised → assigned →
  in-progress → completed → closed/reopened) is appended to an embedded
  `timeline` array with a timestamp and the user who made the change.
- **Billing penalty**: a flat 2% penalty is applied once a bill is confirmed
  overdue, either individually (`/apply-penalty`) or in batch
  (`/run-overdue-check`, intended to be called by a scheduled job/cron in
  production).
- **Booking conflict detection**: prevents double-booking the same facility
  for overlapping time ranges on the same day, checked both at creation and
  at admin-approval time.
- **Notifications**: fired automatically on key events — new complaint (to
  all admins), complaint assigned/status-updated (to the resident), new
  visitor needing approval (to the resident), visitor approval decision (to
  the security guard who logged them), booking approval/rejection (to the
  resident), and new bill generated (to the resident). These are stored
  in-app only (no push/SMS in this phase).
- **Reports**: PDF invoices are generated on-the-fly with `pdfkit`; Excel
  exports use `exceljs`. Both stream directly to the response as file
  downloads rather than being saved to disk.

## Next Steps

Backend is feature-complete per the master spec (Phases 1–11). Phase 12
(Deployment) and the full React/Vite frontend are not included in this
delivery — let's tackle those next.

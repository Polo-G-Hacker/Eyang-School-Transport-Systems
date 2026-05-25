# Eyang School Transport System (ESTS)

Full-stack school transport management system for **Saint Jean Ingénieur (SJI)** with monthly subscription, QR-code boarding, manual cash payment validation, OpenStreetMap bus tracking, and offline-first driver scanning.

> Built around the actual operational reality of a school in a developing country (unstable internet, cash-based payments, fixed pickup points, drivers running rounds with phones).

## Stack

| Layer    | Tech                                                       |
|----------|------------------------------------------------------------|
| Mobile   | **Ionic 7** with **Angular 17** (TypeScript, NgModules)     |
| Backend  | **Node.js + Express**, **PostgreSQL 16**, **bcryptjs**, **jsonwebtoken**, **zod**, **nodemailer** |
| Map      | **OpenStreetMap** tiles via **Leaflet** — *no paid APIs*    |
| QR       | `qrcode` (display) + `html5-qrcode` (scanner) — JWT-signed payload |
| Offline  | `@ionic/storage-angular` (IndexedDB) with sync queue        |

## Repository layout

```
.
├── backend/                      Express API
│   └── src/
│       ├── config/               env, logger
│       ├── controllers/          HTTP handlers
│       ├── db/                   pool, migrations, seed
│       ├── domain/               cross-cutting types
│       ├── middleware/           auth, error-handler, rate-limit
│       ├── repositories/         data-access (one per table family)
│       ├── routes/               versioned router
│       ├── services/             business logic
│       ├── utils/                helpers (period, validate, errors)
│       └── server.ts             entrypoint
├── frontend/                     Ionic + Angular app
│   └── src/app/
│       ├── core/                 api/auth/storage/sync (singletons)
│       ├── shared/               reusable UI primitives
│       └── pages/
│           ├── auth/             login, register, verify-email
│           ├── student/          home, qr-pass, track-bus, profile
│           ├── driver/           home, scanner, bus-setup, pickup-round
│           └── admin/            overview, students, payments, buses, settings
├── docker-compose.yml            Postgres 16 + MailHog
└── README.md
```

## Getting started

### Prerequisites

- Node.js 20+
- Docker + Docker Compose (for the database and dev SMTP)
- npm 10+

### 1. Start the database & SMTP catch-all

```bash
docker compose up -d
```

This boots:
- **PostgreSQL** at `localhost:5432` (db `ests`, user `ests`, password `ests_password`)
- **MailHog** at `localhost:1025` (SMTP) and `localhost:8025` (web UI for verification emails)

### 2. Backend

```bash
cd backend
cp .env.example .env          # tweak as needed
npm install
npm run migrate               # applies SQL files in src/db/migrations/
npm run seed                  # creates an admin, 3 drivers, 8 students, 3 buses
npm run dev                   # http://localhost:4000
```

The seed inserts the following accounts (all passwords are listed below — change them immediately in production):

| Role     | Email                                       | Password         |
|----------|---------------------------------------------|------------------|
| Admin    | `admin@saintjeaningenieur.org`              | `Admin1234!`     |
| Driver   | `k.mensah@saintjeaningenieur.org`           | `Driver1234!`    |
| Driver   | `s.atangana@saintjeaningenieur.org`         | `Driver1234!`    |
| Driver   | `e.fouda@saintjeaningenieur.org`            | `Driver1234!`    |
| Student  | `n.mvondo@example.com`                      | `Student1234!`   |
| Student  | …7 more student accounts (see seed script)  | `Student1234!`   |

### 3. Frontend

```bash
cd frontend
npm install                   # already done if you ran `ionic start`
ionic serve                   # opens http://localhost:8100
```

The frontend points to `http://localhost:4000/api` by default (see `src/environments/environment.ts`).

## Operational model

1. **Account & payment lifecycle.** Students register with any email (institutional emails like `@saintjeaningenieur.org` are pre-approved; personal emails are pending until verified). Each month the admin opens the *Payments* screen, collects cash in person, then taps **Validate cash payment** for that student.
2. **QR pass.** As soon as a payment is validated the backend issues a signed JWT QR token bound to `(user, year, month)`. The frontend caches the QR for offline display and re-render.
3. **Reservation.** The student picks a bus + pickup point for the current month. A `SELECT … FOR UPDATE` lock prevents oversubscription beyond the bus capacity. There is no seat number — only a confirmed slot.
4. **Pickup round.** The driver taps **Start round** which (a) flips the bus to `on_route`, (b) creates a `pickup_rounds` row, and (c) broadcasts an in-app swipe notification to every student with a reservation on that bus. Students respond *yes*/*no* so the driver knows who to expect today.
5. **Boarding.** Driver scans the student's QR code. The backend (or local cache when offline) checks signature, payment validity, reservation, and prior boarding for the round, then logs an `attendance_logs` row. Repeated scans of the same student in the same round are rejected.
6. **Offline-first.** When the driver is offline, scans are queued locally with a `client_event_id`. When the device reconnects, the queue is replayed via `POST /api/boarding/sync`; duplicate event IDs are ignored server-side.
7. **GPS.** While running, the driver app POSTs `lat/lng` snapshots to `/api/gps/ping`. Students see the latest known position on the Leaflet map.

## Database schema (high-level)

- `roles` (student / driver / admin)
- `academic_programs` (L1–L3, M1–M2 in Informatique, Électrique, Mécanique, Génie Civil)
- `users` — unified table with `role_id`, `program_id`, `pickup_point_id`, hashed password, `is_email_verified`, `status` (pending / approved / disabled)
- `email_verification_tokens` — SHA-256 hashed, single-use
- `pickup_points` — Carrefour TKC, Carrefour MEEC, Vogt, Poste Centrale, Famassi, Eyang (destination), with lat/lng
- `buses` — `plate_number`, `color`, `capacity`, `driver_id`, `status`, last GPS sample
- `bus_stops` — bus ↔ pickup_point bridge
- `payments` — `(user, period_year, period_month)` unique; status `pending` / `validated` / `expired` / `unpaid`
- `qr_codes` — JWT payload + expiry, one per `(user, year, month)`
- `reservations` — `(user, year, month)` unique, with bus + pickup; capacity-enforced
- `pickup_rounds` — driver-initiated rounds; `swipe_responses` per student per round
- `attendance_logs` — every scan attempt; uniqueness on `client_event_id` for offline dedup
- `gps_pings` — lightweight position history per bus
- `notifications` — in-app log

Migrations live in `backend/src/db/migrations/` and are applied idempotently by `npm run migrate`.

## API summary

All endpoints are prefixed with `/api` and (unless noted) require a `Bearer <jwt>` access token issued by `/auth/login`.

| Method | Path                                  | Role        | Purpose                              |
|--------|---------------------------------------|-------------|--------------------------------------|
| POST   | `/auth/register`                      | guest       | Create account                        |
| POST   | `/auth/login`                         | guest       | Email + password sign-in              |
| POST/GET | `/auth/verify-email`                | guest       | Consume email verification token      |
| POST   | `/auth/resend-verification`           | guest       | Re-send verification email            |
| GET    | `/auth/me`                            | any auth    | Current user                          |
| GET    | `/users`, `PATCH /users/:id/status`   | admin       | Manage accounts (approve / disable)   |
| GET    | `/buses`                              | any auth    | Fleet + stats                          |
| GET    | `/buses/mine`                         | driver      | The driver's assigned bus             |
| POST   | `/buses`, `PATCH /buses/:id`          | admin       | Manage buses                          |
| GET    | `/buses/:id/reservations`             | admin/driver| Roster for the bus                    |
| GET/POST | `/payments`, `/payments/:id/validate`| admin     | List, create, validate                |
| GET    | `/qr/mine`                            | student     | Issue / fetch QR token for the month  |
| POST   | `/qr/verify`                          | driver/admin| Offline-safe verification             |
| POST   | `/reservations`                       | student     | Reserve a spot                        |
| GET    | `/reservations/mine`                  | student     | Current reservation                   |
| DELETE | `/reservations/mine`                  | student     | Cancel reservation                    |
| POST   | `/boarding/scan`                      | driver      | Boarding scan (online)                |
| POST   | `/boarding/sync`                      | driver      | Bulk replay of offline scans          |
| POST   | `/gps/ping`                           | driver      | Push GPS sample                       |
| GET    | `/gps/buses/:id/latest`               | any auth    | Last known GPS                        |
| POST   | `/pickup-rounds/start`                | driver      | Start round (broadcast swipe)         |
| POST   | `/pickup-rounds/:id/end`              | driver      | End round                             |
| GET    | `/pickup-rounds/:id/expected`         | driver      | Expected roster with swipe answers    |
| POST   | `/swipes`                             | student     | Respond yes/no to a round             |
| GET    | `/notifications`                      | any auth    | In-app notifications                  |
| POST   | `/notifications/read`                 | any auth    | Mark as read                          |
| GET    | `/pickup-points`                      | any auth    | Fixed locations + coordinates         |

Errors are returned as `{ "error": { "code": string, "message": string, "details"?: unknown } }`.

## Offline-first details

- The student app caches the QR token, the current reservation, the buses list, and the pickup points list in IndexedDB.
- The driver app keeps an outbox of scan events in IndexedDB. Each event has a `client_event_id` (UUID). On reconnect, `POST /api/boarding/sync` replays the batch. The server's `ON CONFLICT (client_event_id) DO NOTHING` makes the call idempotent.
- The QR token is a signed JWT carrying `{ uid, sid, pid, pm }` (user id, student id, payment id, period yyyy-MM). The driver app can verify the signature locally; only freshness and "already boarded this round" need server-side checks.

## Security

- Passwords are hashed with **bcryptjs (12 rounds)**.
- Two HMAC secrets: `JWT_SECRET` for session tokens, `QR_SECRET` for QR tokens. **Both must be set to long random strings in production.**
- Session tokens are signed JWTs with role claims and 7-day expiry by default.
- Email verification tokens are SHA-256 hashed before storage (so a DB leak does not directly disclose live tokens).
- Express is hardened with **helmet**, CORS configurable, body limit at 1 MB.
- Rate limiting on auth endpoints (20 req / 15 min / IP) and the global API (120 req / min / IP).

## Tests

The schema, the offline dedup logic, and the JWT verification flow are covered with manual seed scenarios. Automated test scaffolding is intentionally left lean for the MVP; add tests under `backend/tests/` and `frontend/src/app/**/*.spec.ts` as the surface area grows.

## License

MIT

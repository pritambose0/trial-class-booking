# Trial Class Booking

A full-stack web app that lets a parent book a **free 30-minute trial class** with
a Codeyoung mentor. The parent picks a slot in **their own timezone**, the server
**auto-assigns an available mentor**, and both parties receive a confirmation
email with a dummy meeting link.

- **Client:** React 19 + Vite + TypeScript, styled with Tailwind CSS v4 (`client/`)
- **Server:** Node.js + Express 5 + TypeScript + Zod + Mongoose (`server/`)
- **Database:** MongoDB (MongoDB Atlas or any replica set)

---

## Features

- **Timezone-aware scheduling** — the parent's IANA timezone is auto-detected (and
  can be changed); every slot is shown in the parent's local time with the
  mentor's IST time underneath.
- **DST-safe** — all conversions use `luxon` (server) and `Intl` (client), so
  daylight-saving transitions in US/UK/EU zones resolve correctly.
- **Auto mentor assignment** — the parent only picks a time; the server assigns
  the least-loaded available mentor.
- **Booking rules enforced** — 30-minute slots, 09:00–18:00 IST, max **2 confirmed
  classes per mentor per IST day**, no past bookings, and a 30-day booking window.
- **Concurrency-safe** — booking creation runs in a MongoDB transaction and is
  backed by a unique `{ mentor, startsAt }` index. Transient transaction write
  conflicts are retried, and a losing race returns a clean `409` instead of a
  server error (covered by `server/test/integration/booking-concurrency.test.ts`).
- **Dummy meeting link** — generated per booking, persisted, returned by the API,
  emailed to both parties, and shown/copyable on the confirmation screen.
- **Confirmation emails** — HTML email to the parent (their local time) and the
  mentor (IST). With no SMTP configured, emails are rendered and logged instead of
  sent.
- **Polished, responsive UI** — sticky glass header, gradient hero, day tabs,
  slot grid, inline-validated booking modal, and confirmation screen; includes
  loading, empty, and error states plus reduced-motion support.

---

## Tech Stack

| Layer      | Technology                                                                 |
| ---------- | -------------------------------------------------------------------------- |
| Frontend   | React 19, Vite, TypeScript, Tailwind CSS v4                                |
| Backend    | Node.js, Express 5, TypeScript (ESM), Zod                                  |
| Database   | MongoDB, Mongoose                                                          |
| Scheduling | Luxon (server), `Intl.DateTimeFormat` (client)                             |
| Email      | Nodemailer (SMTP, with JSON-transport fallback)                            |
| Logging    | Pino                                                                       |
| Tooling    | npm, oxlint (client lint), `node:test` + tsx (server tests), Helmet, CORS |

---

## Prerequisites

- **Node.js >= 20** and **npm**
- A **MongoDB connection** (MongoDB Atlas cluster or any replica set). Transactions
  are used for booking creation, so a standalone `mongod` without a replica set
  will not work.
- (Optional) SMTP credentials to actually deliver emails.

---

## Project Structure

```
trial-class-booking/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Header, TimezoneSelect, DayTabs, SlotGrid,
│   │   │                       # BookingModal, Confirmation, Status
│   │   ├── lib/                # api.ts, time.ts, types.ts
│   │   ├── App.tsx             # composes the booking flow
│   │   ├── index.css           # Tailwind v4 theme tokens
│   │   └── main.tsx
│   └── .env.example
└── server/                     # Express + TypeScript API
    ├── src/
    │   ├── controllers/        # HTTP request/response handling
    │   ├── services/           # business logic + database access
    │   ├── models/             # Mongoose schemas (Mentor, Booking)
    │   ├── validators/         # Zod schemas
    │   ├── routes/             # endpoint + middleware wiring
    │   ├── middlewares/        # error handler, Zod middleware
    │   ├── utils/              # ApiError, ApiResponse, time, meeting
    │   ├── lib/                # env, db, logger, mailer
    │   ├── scripts/            # bootstrapMentors (10-mentor seed)
    │   ├── app.ts              # Express app
    │   └── index.ts            # server entrypoint
    └── test/                   # node:test unit suite
```

The backend follows a strict layered flow:
`route → validation → controller → service → model`.

---

## Environment Setup

### Server (`server/.env`)

```bash
cd server
cp .env.example .env
```

| Variable           | Default                          | Description                                                 |
| ------------------ | -------------------------------- | ----------------------------------------------------------- |
| `NODE_ENV`         | `development`                    | Runtime environment.                                        |
| `PORT`             | `4000`                           | API port.                                                   |
| `CLIENT_ORIGIN`    | `http://localhost:5173`          | Allowed CORS origin.                                        |
| `MONGODB_URI`      | — **(required)**                 | MongoDB connection string.                                  |
| `MONGODB_DB_NAME`  | `trial-class-booking`            | Optional DB name (overrides the URI).                       |
| `MEETING_BASE_URL` | `https://meet.jit.si`            | Base URL for generated dummy meeting links.                 |
| `MAIL_FROM`        | `Trial Class Booking <no-reply@trialclass.local>` | From address for emails.          |
| `SMTP_HOST`        | —                                | SMTP host. Omit to generate/log emails instead of sending.  |
| `SMTP_PORT`        | `587`                            | SMTP port.                                                  |
| `SMTP_SECURE`      | `false`                          | `true` for TLS (port 465).                                  |
| `SMTP_USER`        | —                                | SMTP username.                                              |
| `SMTP_PASS`        | —                                | SMTP password / app password.                               |

> `.env` is git-ignored. `.env.example` contains placeholders only — never commit
> real credentials.

### Client (`client/.env`)

```bash
cd client
cp .env.example .env
```

| Variable       | Default                        | Description                       |
| -------------- | ------------------------------ | --------------------------------- |
| `API_URL`      | `http://localhost:4000/api/v1` | Base URL of the booking API.      |

---

## Installation

Install each package independently (two npm packages in one repo):

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

---

## Running the App

Start the API and the web app in two terminals:

```bash
# Terminal 1 — API (http://localhost:4000)
cd server
npm run dev

# Terminal 2 — Web (http://localhost:5173)
cd client
npm run dev
```

On startup the server connects to MongoDB and **idempotently seeds the 10-mentor
roster** (`bootstrapMentors`), so the app is immediately bookable.

Production-style run:

```bash
cd server && npm run build && npm start
cd client && npm run build && npm run preview
```

---

## API Reference

All endpoints are served under the base path **`/api/v1`**. Responses use a
consistent envelope: `{ success, message, data }` (errors also include
`errors: [{ field, message }]`).

| Method | Path                            | Description                                         |
| ------ | ------------------------------- | --------------------------------------------------- |
| GET    | `/api/v1/health`                | Health check.                                       |
| GET    | `/api/v1/mentors`               | List all mentors.                                   |
| GET    | `/api/v1/mentors/:id`           | Get a single mentor.                                |
| GET    | `/api/v1/bookings/availability` | Available slots for an IST date.                    |
| POST   | `/api/v1/bookings`              | Create a booking (auto-assigns a mentor if omitted).|
| GET    | `/api/v1/bookings/:id`          | Get a booking.                                      |

### `GET /api/v1/bookings/availability`

Query params:

- `date` **(required)** — the IST day to inspect, `YYYY-MM-DD`.
- `timezone` (optional) — IANA zone; adds `startsAtLocal`/`endsAtLocal` labels.
- `mentor` (optional) — restrict to one mentor. If omitted, a slot is marked
  available when **at least one** mentor can take it.

Each slot includes `startsAt`/`endsAt` (UTC ISO), `startsAtIST`/`endsAtIST`,
optional `startsAtLocal`/`endsAtLocal`, and `available`.

### `POST /api/v1/bookings`

```json
{
  "mentor": "6512f... (optional — omit to auto-assign)",
  "parentName": "Jane Doe",
  "parentEmail": "jane@example.com",
  "childAge": 9,
  "timezone": "America/New_York",
  "startsAt": "2026-10-20T03:30:00.000Z"
}
```

- `startsAt` may be a UTC ISO string **or** a wall-clock time in `timezone`
  (e.g. `"2026-10-20T09:00:00"`).
- When `mentor` is omitted the server assigns an available mentor, preferring the
  one with the fewest bookings that day.
- On success (`201`) the response includes the assigned mentor, a dummy
  `meetingLink`, and local/IST formatted times. Confirmation emails are sent to
  the parent and the mentor.

### Error codes

| Status | Meaning                                                                 |
| ------ | ----------------------------------------------------------------------- |
| `400`  | Malformed request parameter.                                            |
| `404`  | Unknown mentor / booking / route.                                       |
| `409`  | No mentor available, slot taken, or a booking race lost.               |
| `422`  | Validation failed, slot outside business hours / not on a 30-min boundary, past slot, or beyond the booking window. |

---

## Timezones & DST

- Trial classes run **09:00–18:00 IST (`Asia/Kolkata`)** in **30-minute slots**.
  India has no DST, so IST is the fixed anchor.
- Every booking carries the parent's IANA `timezone`; the server resolves it with
  **luxon**, so US/UK DST transitions are handled automatically.
- Responses return both raw UTC instants and human-readable labels in the
  parent's zone and IST. Emails show the parent their local time and the mentor
  IST.

## Booking Rules

- 30-minute slots on exact `:00`/`:30` IST boundaries inside 09:00–18:00 IST.
- Max **2 confirmed classes per mentor per IST calendar day**.
- No past bookings; bookings allowed from now through **30 days ahead**.
- Overlap conflicts are prevented inside a MongoDB transaction, and the unique
  `{ mentor, startsAt }` index guards against concurrent double-booking.

---

## Testing & Checks

### Server (`server/`)

```bash
npm run typecheck            # tsc --noEmit
npm run typecheck:test       # type-check src + tests (tsconfig.test.json)
npm test                     # node:test unit suite (28 tests, no live DB required)
npm run test:integration       # integration tests against a local replica set
npm run test:integration:atlas # same tests, using MONGODB_URI from .env (Atlas)
npm run build                # compile to dist/
```

The unit suite (`server/test/*.test.ts`) covers timezone/DST resolution, the IST
business window, meeting-link generation, the booking/availability Zod schemas,
the unique slot index, and the required `timezone` field. It uses `node:test` with
`tsx` and does **not** require a running MongoDB, because it only exercises pure
utilities, schemas, and schema metadata.

The integration suite (`server/test/integration/*.test.ts`) exercises the real
service layer against MongoDB. It covers the "day is fully booked" path (once all
10 mentors hit their 2-class daily cap, availability reports `remainingSlots: 0`,
every slot is `available: false`, and the next booking gets a `409`) and the
concurrency path: two simultaneous requests for the same slot must produce
exactly one booking and one `409`, never a double-booking or a `500`. Because
bookings run in a transaction, it **requires a replica set** and a database whose
name contains `test` (the test refuses to run otherwise).

Run it against a **local replica set** (expects `mongodb://127.0.0.1:27017/…?replicaSet=rs0`):

```bash
cd server
npm run test:integration
```

Start one with Docker if you don't have MongoDB running locally:

```bash
docker run -d --name mongo-rs -p 27017:27017 mongo:7 --replSet rs0 --bind_ip_all
docker exec mongo-rs mongosh --eval "rs.initiate()"
```

Or run the same tests against **MongoDB Atlas** — no local database needed, it
reuses `MONGODB_URI` from `server/.env`:

```bash
cd server
npm run test:integration:atlas
```

Both variants always connect to a separate database whose name contains `test`
(default `trial-class-booking-integration-test`), so application data is never
touched, and `SMTP_HOST=` keeps booking emails as logs instead of sending them.


### Client (`client/`)

```bash
npm run lint     # oxlint
npm run build    # tsc -b && vite build
npm run preview  # serve the production build
```

---

## Security Notes

- Helmet sets security headers; CORS is restricted to `CLIENT_ORIGIN`.
- JSON/urlencoded request bodies are capped at `16kb`.
- All input is validated with Zod **before** reaching controllers/services.
- No secrets are committed — `.env` is git-ignored and `.env.example` holds
  placeholders only.
- There is **no authentication** (parents are identified by submitted details) and
  **no cancellation** feature, per the agreed scope.
- Not implemented (out of scope): API rate limiting.

---

## Status

- [x] Phase 1 — Project setup (scaffolding, health endpoint)
- [x] Phase 2 — Database models, seed data, availability API
- [x] Phase 3 — Booking creation and business rules (timezones, DST, meeting link, emails)
- [x] Phase 4 — Frontend booking flow (timezone-aware booking UI)
- [x] Phase 5 — Polish, tests, and documentation

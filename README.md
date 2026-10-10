# Trial Class Booking

A full-stack trial class booking application.

- **Frontend:** React + Vite + TypeScript (`client/`)
- **Backend:** Node.js + Express + TypeScript (`server/`)
- **Database:** MongoDB Atlas + Mongoose (wired in a later phase)
- **Validation:** Zod (added in a later phase)

## Project Structure

```
trial-class-booking/
├── client/            # React + Vite frontend
└── server/            # Express + TypeScript API
```

## Prerequisites

- Node.js >= 20
- npm

## Setup

### Server

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Environment variables (see `server/.env.example`):

| Variable          | Default                 | Description                                              |
| ----------------- | ----------------------- | -------------------------------------------------------- |
| `NODE_ENV`        | `development`           | Runtime environment                                      |
| `PORT`            | `4000`                  | API port                                                 |
| `CLIENT_ORIGIN`   | `http://localhost:5173` | Allowed CORS origin for the web                          |
| `MONGODB_URI`     | — (required)            | MongoDB Atlas connection string                          |
| `MONGODB_DB_NAME` | `trial-class-booking`   | Optional DB name, overrides the URI                      |
| `MEETING_BASE_URL`| `https://meet.jit.si`   | Base URL for generated dummy meeting links               |
| `MAIL_FROM`       | `Trial Class Booking …` | From address for booking emails                          |
| `SMTP_HOST`       | —                       | SMTP host (e.g. `smtp.gmail.com`). Omit to log emails     |
| `SMTP_PORT`       | `587`                   | SMTP port                                                |
| `SMTP_SECURE`     | `false`                 | Use TLS (`true` for port 465)                            |
| `SMTP_USER`       | —                       | SMTP username (email address)                            |
| `SMTP_PASS`       | —                       | SMTP password / app password                             |

> If `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` are not set, booking emails are still
> rendered and written to the server log instead of being delivered.

### Client

```bash
cd client
npm install
npm run dev
```

The Vite dev server runs at `http://localhost:5173`.

## Scripts

| Location | Command             | Description                    |
| -------- | ------------------- | ------------------------------ |
| server   | `npm run dev`       | Start API with hot reload      |
| server   | `npm run build`     | Compile TypeScript to `dist/`  |
| server   | `npm start`         | Run compiled API               |
| server   | `npm run typecheck` | Type-check without emitting    |
| client   | `npm run dev`       | Start Vite dev server          |
| client   | `npm run build`     | Type-check and build for prod  |
| client   | `npm run lint`      | Lint the client                |
| client   | `npm run preview`   | Preview production build       |

## API

All endpoints are served under the base path `/api/v1`.

### Timezones & DST

- Trial-class working hours are **09:00–18:00 IST (`Asia/Kolkata`)**, in 30-minute
  slots. India has no DST, so IST is the fixed anchor.
- Every booking request carries the parent's IANA `timezone` (e.g.
  `America/New_York`, `Europe/London`). The server converts between the parent's
  local wall-clock time and UTC using **`luxon`**, which resolves DST
  transitions automatically.
- Responses return both raw UTC instants (`startsAt`, `endsAt`) and
  human-readable local labels (`startsAtLocal`/`endsAtLocal` in the parent's
  zone) plus `startsAtIST`/`endsAtIST`.
- Confirmation emails show the parent their **local** time and the mentor **IST**.

### Endpoints

| Method | Path                              | Description                                    |
| ------ | --------------------------------- | ---------------------------------------------- |
| GET    | `/api/v1/health`                  | Health check                                   |
| GET    | `/api/v1/mentors`                 | List all mentors                               |
| GET    | `/api/v1/mentors/:id`             | Get a single mentor                            |
| GET    | `/api/v1/bookings/availability`   | Available slots for a date                     |
| POST   | `/api/v1/bookings`                | Create a booking                               |
| GET    | `/api/v1/bookings/:id`            | Get a booking                                  |

**GET `/api/v1/bookings/availability`**

Query params:

- `date` (required) — the IST day to inspect, `YYYY-MM-DD`.
- `timezone` (optional) — IANA zone; adds `startsAtLocal`/`endsAtLocal` labels.
- `mentor` (optional) — restrict to one mentor. If omitted, a slot is marked
  available when **at least one** mentor can take it.

**POST `/api/v1/bookings`**

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
- When `mentor` is omitted the system assigns an available mentor, preferring
  the one with the fewest bookings that day.
- On success the response includes the assigned mentor, a dummy `meetingLink`,
  and local/IST formatted times. Confirmation emails are sent to the parent and
  the mentor.
- Errors: `409` when no mentor is available / the slot is taken, `422` for a
  slot outside business hours or on an invalid boundary, `404` for an unknown
  mentor.

## Health Check

```
GET /api/v1/health
```

Returns:

```json
{
  "status": "ok",
  "service": "trial-class-booking-server",
  "timestamp": "2026-10-10T06:56:09.337Z"
}
```

## Status

- [x] Phase 1 — Project setup (scaffolding, health endpoint)
- [x] Phase 2 — Database models, seed data, availability API
- [x] Phase 3 — Booking creation and business rules (timezones, DST, meeting link, emails)
- [ ] Phase 4 — Frontend booking flow
- [ ] Phase 5 — Polish and documentation

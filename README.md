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

| Variable         | Default                 | Description                             |
| ---------------- | ----------------------- | --------------------------------------- |
| `NODE_ENV`       | `development`           | Runtime environment                     |
| `PORT`           | `4000`                  | API port                                |
| `CLIENT_ORIGIN`  | `http://localhost:5173` | Allowed CORS origin for the web         |
| `MONGODB_URI`    | — (required)            | MongoDB Atlas connection string         |
| `MONGODB_DB_NAME`| `trial-class-booking`   | Optional DB name, overrides the URI      |

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

## Health Check

```
GET /api/health
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
- [ ] Phase 2 — Database models, seed data, availability API
- [ ] Phase 3 — Booking creation and business rules
- [ ] Phase 4 — Frontend booking flow
- [ ] Phase 5 — Polish and documentation

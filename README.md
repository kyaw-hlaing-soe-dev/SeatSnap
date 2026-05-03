# SeatSnap 🏥

> No more 5am queues. A production-grade clinic appointment slot booking system that solves real double-booking chaos in Southeast Asian healthcare.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)](https://typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat&logo=express)](https://expressjs.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=next.js)](https://nextjs.org)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat&logo=sqlite)](https://sqlite.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis)](https://redis.io)
[![Deployed on AWS](https://img.shields.io/badge/Backend-AWS_EC2-FF9900?style=flat&logo=amazon-aws)](https://aws.amazon.com)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat&logo=vercel)](https://vercel.com)

---

## The Real Problem

In Myanmar and across Southeast Asia, patients wake up at 5am and physically rush to clinics just to get a queue number. Two patients reach the counter at the same time. The receptionist double-books the same slot. The doctor sees two patients at 9am. Chaos.

SeatSnap solves this digitally — with atomic reservations, pessimistic row locking, and a 5-minute hold system that mirrors how real ticketing platforms work.

---

## Live Demo

| Service | URL |
|---|---|
| Frontend | https://seatsnap.vercel.app |
| Backend API | http://your-ec2-ip/clinics |
| API Docs | http://your-ec2-ip/api-docs |

---

## System Architecture
Patient Browser
      │
      ▼ HTTPS
┌─────────────────┐
│   Vercel CDN    │  Next.js 14 (App Router)
│  React Frontend │  TanStack Query + Zustand
└────────┬────────┘
         │ HTTPS + X-Correlation-ID
         ▼
┌─────────────────┐
│   AWS EC2       │
│   Nginx :443    │  Reverse proxy
│       ↓         │
│  Express :3000  │  TypeScript + TypeORM
│       ↓    ↓    │
│  SQLite  Redis  │  DB + Rate limit store
└─────────────────┘

---

## API Documentation — Swagger UI

Interactive API docs are available at /api-docs when the server is running.

![SeatSnap Swagger UI](https://raw.githubusercontent.com/kyaw-hlaing-soe-dev/SeatSnap/main/swagger-ui-image/image.png)

> Local: http://localhost:3000/api-docs
> Production: http://your-ec2-ip/api-docs

All endpoints are documented with request body schemas, success responses, and error codes — including 409 Conflict, 422 Validation Error, and 429 Rate Limited.

---

## Tech Stack

### Backend
| Tool | Purpose |
|---|---|
| Node.js 20 + TypeScript | Runtime |
| Express.js | HTTP framework |
| TypeORM | ORM with migration support |
| better-sqlite3 | SQLite driver (synchronous, fast) |
| Pino | Structured JSON logging |
| Zod | Request validation |
| ioredis + express-rate-limit | Redis-backed rate limiting |
| swagger-ui-express | Auto-generated API docs |
| node-cron | Ghost reservation cleanup |
| PM2 | Process management |
| Nginx | Reverse proxy |

### Frontend
| Tool | Purpose |
|---|---|
| Next.js 14 (App Router) | React framework |
| Tailwind CSS | Styling |
| TanStack Query | Server state + caching |
| Zustand | Client state |
| React Hook Form + Zod | Form validation |
| Axios | HTTP client with interceptors |
| Framer Motion | Animations |

---

## Features

### Core
- Clinic Discovery — browse all clinics with real-time available slot counts
- Atomic Slot Reservation — 5-minute hold with countdown timer
- Purchase Confirmation — convert PENDING → COMPLETED before expiry
- Ghost Release — automatic cleanup of expired holds every 60 seconds

### Reliability
- Zero double-booking — pessimistic write lock on slot rows
- Optimistic locking — alternative method using @VersionColumn
- Atomic stock decrement — single SQL UPDATE WHERE availableCount > 0
- Full transaction rollback — stock never lost if reservation save fails

### Observability
- Correlation IDs — every request tagged with UUID via AsyncLocalStorage
- Structured logging — Pino JSON logs, every line carries correlationId
- Global error handler — consistent { error, message, ref } shape on all errors
- Swagger UI — interactive API docs at /api-docs

### Security
- Rate limiting — 5 requests/minute/IP on /reserve via Redis
- Zod validation — strict schema on all POST endpoints, unknown keys rejected
- Response DTOs — version and internal columns never exposed to clients
- CORS — locked to exact Vercel URL, no wildcard

### Operations
- Graceful shutdown — SIGTERM waits for in-flight requests before closing DB
- Migration-only schema — synchronize: false, all changes via TypeORM migrations
- PM2 process manager — auto-restart on crash, survives server reboots

---

## Project Structure
seatsnap/
├── src/
│   ├── context/
│   │   └── asyncContext.ts       # AsyncLocalStorage — one instance, shared everywhere
│   ├── logger/
│   │   └── index.ts              # Pino logger with auto correlationId injection
│   ├── errors/
│   │   └── AppError.ts           # ValidationError, NotFoundError, ConflictError...
│   ├── middleware/
│   │   ├── correlationId.ts      # Tag every request before anything else runs
│   │   ├── errorHandler.ts       # Global 4-param error middleware (must be last)
│   │   ├── validate.ts           # Zod middleware factory
│   │   └── rateLimiter.ts        # Redis-backed 5 req/min on /reserve
│   ├── schemas/
│   │   └── reservation.schema.ts # Zod schemas for /reserve + /purchase
│   ├── dto/
│   │   └── slot.dto.ts           # Strip version + internal fields from responses
│   ├── entity/
│   │   ├── Clinic.ts
│   │   ├── AppointmentSlot.ts    # Has @VersionColumn for optimistic locking
│   │   └── Reservation.ts        # PENDING → COMPLETED → EXPIRED state machine
│   ├── migration/
│   │   ├── XXXX-InitSchema.ts    # Tables + B-Tree + Partial indexes
│   │   ├── XXXX-AddCategory.ts   # Walk-in / Scheduled / Emergency
│   │   └── XXXX-AddVersion.ts    # Optimistic lock version column
│   ├── routes/
│   │   ├── clinics.ts            # GET /clinics
│   │   └── appointments.ts       # POST /reserve, /reserve-optimistic, /purchase
│   ├── cron.ts                   # Ghost slot cleanup every 60 seconds
│   ├── data-source.ts            # TypeORM config — synchronize: false
│   ├── swagger.ts                # OpenAPI 3.0 spec config
│   └── index.ts                  # App entry — middleware order + graceful shutdown
├── swagger-ui-image/
│   └── image.png                 # Swagger UI screenshot
├── tests/
│   ├── setup/
│   │   ├── seed.ts               # Known DB state before each suite
│   │   ├── reset.ts              # Clean slate between tests
│   │   └── db.ts                 # Direct SQLite connection for assertions
│   ├── integration/
│   │   ├── clinics.test.ts
│   │   ├── reserve.test.ts
│   │   ├── purchase.test.ts
│   │   ├── concurrency.test.ts   # The most important file
│   │   ├── rateLimit.test.ts
│   │   └── cleanup.test.ts
│   └── e2e/
│       ├── booking-flow.spec.ts  # Full patient journey
│       └── error-states.spec.ts  # What patient sees on failure
├── .env.example
├── .gitignore
├── tsconfig.json
├── vitest.config.ts
└── package.json

---

## Getting Started

### Prerequisites

- Node.js 20+
- Redis running on localhost:6379
- Docker (optional, for Redis)

### 1. Clone & Install
git clone https://github.com/kyaw-hlaing-soe-dev/SeatSnap.git
cd SeatSnap
npm install

### 2. Environment Setup
cp .env.example .env

Edit .env:
PORT=3000
NODE_ENV=development
DATABASE_PATH=./seatsnap.db
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:3001

### 3. Start Redis
# With Docker
docker run -d -p 6379:6379 redis

# Or with Homebrew (Mac)
brew services start redis

### 4. Run Migrations
npm run migration:run

This creates seatsnap.db with all tables and indexes.

### 5. Start Development Server
npm run dev

API is now running at http://localhost:3000

---

## API Reference

### Base URLhttp://localhost:3000
### Headers (all requests)Content-Type: application/json
X-Correlation-ID: <optional — generated if missing>

### Endpoints

#### GET /clinics
Returns all clinics with their available appointment slots.

Response `200`
[
  {
    "id": 1,
    "name": "City Medical Center",
    "address": "123 Main St, Yangon",
    "slots": [
      {
        "id": 1,
        "timeLabel": "09:00 AM",
        "availableCount": 1,
        "category": "Walk-in",
        "clinicId": 1
      }
    ]
  }
]

---

#### POST /reserve
Reserve a slot using pessimistic write lock. Holds slot for 5 minutes.

Request body
{
  "slotId": 1,
  "userId": "patient-001"
}

Response `201`
{
  "message": "Slot reserved! You have 5 minutes to confirm.",
  "reservationId": 42,
  "expiresAt": "2024-01-15T10:28:41.000Z"
}

Errors
| Status | Code | Reason |
|---|---|---|
| 404 | NOT_FOUND | Slot does not exist |
| 409 | CONFLICT | No slots available |
| 422 | VALIDATION_ERROR | Invalid request body |
| 429 | RATE_LIMITED | More than 5 requests/minute from this IP |

---

#### POST /reserve-optimistic
Reserve a slot using optimistic locking (`@VersionColumn`). No row lock — detects conflict at save time.

Same request/response shape as /reserve. Returns 409 on version mismatch.

---

#### POST /purchase
Confirm a PENDING reservation before it expires.

Request body
{
  "reservationId": 42,
  "userId": "patient-001"
}

Response `200`
{
  "message": "Appointment confirmed!",
  "reservation": {
    "id": 42,
    "userId": "patient-001",
    "status": "COMPLETED",
    "slotId": 1,
    "expiresAt": "2024-01-15T10:28:41.000Z"
  }
}

Errors
| Status | Code | Reason |
|---|---|---|
| 404 | NOT_FOUND | Reservation not found or wrong userId |
| 409 | CONFLICT | Already completed or expired |
| 422 | VALIDATION_ERROR | Invalid request body |

---

### Error Response Shape

Every error returns the same shape:
{
  "error": "CONFLICT",
  "message": "No slots available",
  "ref": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}

The ref field is the X-Correlation-ID — use it to trace the request in logs.

---

## Database Schema
-- Clinics
CREATE TABLE clinic (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  name    TEXT NOT NULL,
  address TEXT NOT NULL
);

-- Appointment Slots
CREATE TABLE appointment_slot (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  timeLabel       TEXT NOT NULL,
  availableCount  INTEGER NOT NULL DEFAULT 1,
  category        TEXT NOT NULL DEFAULT 'Walk-in',
  version         INTEGER NOT NULL DEFAULT 1,
  clinicId        INTEGER NOT NULL,
  FOREIGN KEY (clinicId) REFERENCES clinic(id)
);

-- Reservations
CREATE TABLE reservation (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  userId    TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'PENDING',
  expiresAt DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  slotId    INTEGER NOT NULL,
  FOREIGN KEY (slotId) REFERENCES appointment_slot(id)
);

-- B-Tree index: speeds up GET /clinics JOIN
CREATE INDEX IDX_slot_clinicId ON appointment_slot(clinicId);

-- Partial index: cleanup cron only queries PENDING rows
CREATE INDEX IDX_reservation_pending
  ON reservation(status)
  WHERE status = 'PENDING';

---

## Indexes Explained

### B-Tree Index on clinicId

GET /clinics joins appointment_slot on clinicId. Without an index, SQLite scans every row. With the index, it jumps directly to matching rows in O(log n).
EXPLAIN QUERY PLAN
SELECT * FROM appointment_slot WHERE clinicId = 1;
-- SEARCH appointment_slot USING INDEX IDX_slot_clinicId (clinicId=?)

### Partial Index on status = 'PENDING'

The cleanup cron queries WHERE status = 'PENDING' every minute. A standard index on status would include all COMPLETED and EXPIRED rows — millions over time. The partial index only stores PENDING rows, so it stays tiny and fast forever, regardless of how many completed appointments accumulate.
EXPLAIN QUERY PLAN
SELECT * FROM reservation
WHERE status = 'PENDING' AND expiresAt < datetime('now');
-- SEARCH reservation USING INDEX IDX_reservation_pending (status=?)

---

## How Double-Booking Is Prevented
### The Problem

Two patients click "Reserve" at the exact same millisecond:
Time 0ms: Patient A reads slot → availableCount = 1
Time 0ms: Patient B reads slot → availableCount = 1
Time 1ms: Patient A checks: 1 > 0? Yes → decrements → saves 0
Time 1ms: Patient B checks: 1 > 0? Yes → decrements → saves 0
Result: Two reservations. One slot. Doctor double-booked.

### The Solution — Pessimistic Write Lock
Time 0ms: Patient A acquires lock on slot row
Time 0ms: Patient B requests lock → FORCED TO WAIT
Time 1ms: Patient A: stock 1 → 0, creates reservation → COMMIT → releases lock
Time 1ms: Patient B: reads stock = 0 → returns 409 CONFLICT
Result: One reservation. Correct.

### The Atomic Stock Update

Instead of fetch → calculate in JS → save back:
UPDATE appointment_slot
SET availableCount = availableCount - 1
WHERE id = :slotId AND availableCount > 0

The database does the math atomically. If 0 rows are affected — stock was already 0. No race condition window exists.

### The Rollback Guarantee
Transaction starts
  ↓ Decrement stock        (WAL journal only — real table unchanged)
  ↓ Save reservation       (WAL journal only)
  ↓ COMMIT                 → both changes land simultaneously

If reservation save throws:
  ↓ catch → ROLLBACK       → WAL journal discarded
  ↓ Real table: stock restored to original value
  ↓ No stock lost. No phantom reservation.

### The Invariant That Must Never Be Violated
availableCount + active_PENDING_reservations = original_stock

This equation must hold at all times for every slot. Concurrency tests verify this directly by querying the database after every concurrent request storm.

---

## Migrations

All schema changes go through TypeORM migrations. synchronize: false is set — TypeORM never auto-modifies tables.
# Generate a new migration from entity changes
npm run migration:generate src/migration/MyChangeName

# Apply all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

### Migration History

| File | Change |
|---|---|
| InitSchema | Creates all 3 tables + both indexes |
| AddCategory | Adds category column with Walk-in default |
| AddVersion | Adds version column for optimistic locking |

Rule: Never edit an existing migration file. Always create a new one.

---

## Running Tests

### Integration Tests

Tests run against a real SQLite database and real Redis. Both must be running.
# Run all integration tests
npx vitest run tests/integration/

# Run a specific file
npx vitest run tests/integration/concurrency.test.ts

# Watch mode during development
npx vitest tests/integration/

### E2E Tests (Playwright)

Both frontend and backend must be running.
# Start backend (port 4000)
PORT=4000 npm run dev

# Start frontend (port 3001)
cd frontend && npm run dev

# Run Playwright tests
npx playwright test tests/e2e/

### The Concurrency Test

The most important test — proves zero double-booking under real load:
npx vitest run tests/integration/concurrency.test.ts

Fires 10 simultaneous requests at a slot with availableCount = 1. Expects exactly one 201 and nine `409`s. Asserts the DB invariant holds.

---

## Deployment

### Backend — AWS EC2
# On EC2 (Ubuntu 22.04)
git clone https://github.com/kyaw-hlaing-soe-dev/SeatSnap.git
cd SeatSnap
npm install
npm run build
npm run migration:run

# Start with PM2
pm2 start dist/index.js --name seatsnap
pm2 save
pm2 startup

Nginx config forwards :80 → localhost:3000.
Redis runs on same instance, bound to 127.0.0.1 only.

### Frontend — Vercel
# Via Vercel CLI
cd frontend
vercel --prod

Set environment variable in Vercel dashboard:NEXT_PUBLIC_API_URL = http://your-ec2-public-ip

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| PORT | Express port | 3000 |
| NODE_ENV | Environment | production |
| DATABASE_PATH | SQLite file path | ./seatsnap.db |
| REDIS_HOST | Redis hostname | 127.0.0.1 |
| REDIS_PORT | Redis port | 6379 |
| CORS_ORIGIN | Allowed frontend URL | https://seatsnap.vercel.app |

---

## On AI-Assisted Development

AI tools (Cursor, Claude) helped with:
- Boilerplate — entity decorators, route skeletons, type definitions
- Syntax lookups — TypeORM query builder API, Zod .strict() behavior
- Saved roughly 2–3 hours of documentation reading

AI did NOT get right without manual correction:
- Initially suggested synchronize: true — violates the migration-only requirement
- Generated transaction pattern without pessimistic_write lock — would not have solved double-booking
- Suggested AsyncLocalStorage but placed next() outside the runWithContext callback — breaks correlation ID propagation entirely
- Recommended wildcard CORS origin: '*' — security issue

Architecture decisions — transaction boundaries, lock modes, index type choice, middleware order — must be manually verified. AI writes fast. It does not reason about concurrency.

---

## What I Learned

Transactions are a promise. Either everything inside happened, or nothing did. The entire double-booking solution is: make the counter decrement and the reservation creation part of the same promise.

Partial indexes are about growth curves. A regular index on status grows to millions of rows over time. A partial index on status = 'PENDING' stays at ~50 rows forever — because PENDING is always a tiny minority. The cleanup cron stays fast even at year 3.

Pessimistic vs Optimistic locking is about probability. Pessimistic is correct when conflicts are frequent (limited seats, many simultaneous users). Optimistic is faster when conflicts are rare. For a clinic slot with one seat during peak booking time — pessimistic is the right choice.

AsyncLocalStorage is not optional for observability. Passing correlationId as a parameter through every function is not maintainable. AsyncLocalStorage makes it invisible infrastructure — every log line carries the ID without any developer thinking about it.

---

## License

MIT — see [LICENSE](LICENSE)

---

## Author

Kyaw Hlaing Soe
Junior Backend Engineer
[GitHub](https://github.com/kyaw-hlaing-soe-dev)

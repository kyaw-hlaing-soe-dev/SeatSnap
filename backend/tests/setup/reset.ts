import Redis from "ioredis"
import { beforeAll, beforeEach } from "vitest"
import { db } from "./db"
import { seedKnownState } from "./seed"

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000"

export async function ensureServersReady(): Promise<void> {
  const backend = await fetch(`${backendUrl}/clinics`)
  if (!backend.ok) {
    throw new Error(`Backend not ready at ${backendUrl}`)
  }
}

function ensureSchema(): void {
  db.exec("DROP TABLE IF EXISTS reservation_broken")

  db.exec(`
    CREATE TABLE IF NOT EXISTS clinic (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS appointment_slot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timeLabel TEXT NOT NULL,
      availableCount INTEGER NOT NULL DEFAULT 1,
      clinicId INTEGER NOT NULL,
      category TEXT NOT NULL DEFAULT 'Walk-in',
      version INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (clinicId) REFERENCES clinic(id)
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS reservation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      expiresAt DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      slotId INTEGER NOT NULL,
      FOREIGN KEY (slotId) REFERENCES appointment_slot(id)
    );
  `)

  db.exec("CREATE INDEX IF NOT EXISTS IDX_slot_clinicId ON appointment_slot(clinicId)")
  db.exec(
    "CREATE INDEX IF NOT EXISTS IDX_reservation_pending ON reservation(status) WHERE status = 'PENDING'"
  )
}

export function resetDatabase(): void {
  let lastError: unknown

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      db.exec("BEGIN IMMEDIATE TRANSACTION")
      db.exec("DELETE FROM reservation")
      db.exec("DELETE FROM appointment_slot")
      db.exec("DELETE FROM clinic")
      seedKnownState()
      db.exec("COMMIT")
      return
    } catch (err) {
      lastError = err
      try {
        db.exec("ROLLBACK")
      } catch {
        // Ignore rollback errors when no transaction is active.
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25)
    }
  }

  throw lastError
}

export async function flushRedis(): Promise<void> {
  const redis = new Redis({
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: Number(process.env.REDIS_PORT ?? 6379),
  })
  await redis.flushdb()
  await redis.quit()
}

beforeAll(async () => {
  await ensureServersReady()
  ensureSchema()
})

beforeEach(async () => {
  await flushRedis()
  resetDatabase()
})

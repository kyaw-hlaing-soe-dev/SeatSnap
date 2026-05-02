import Database from "better-sqlite3"
import path from "node:path"

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH ?? "./seatsnap.db")

export const db = new Database(dbPath)

db.pragma("foreign_keys = ON")
db.pragma("journal_mode = WAL")
db.pragma("busy_timeout = 5000")

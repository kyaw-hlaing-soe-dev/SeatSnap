import { db } from "./db"

export function seedKnownState(): void {
  db.prepare(
    "INSERT INTO clinic (id, name, address) VALUES (?, ?, ?)"
  ).run(1, "City Clinic", "123 Main St")
  db.prepare(
    "INSERT INTO clinic (id, name, address) VALUES (?, ?, ?)"
  ).run(2, "North Clinic", "456 North Rd")

  const insertSlot = db.prepare(
    "INSERT INTO appointment_slot (id, clinicId, timeLabel, availableCount, category, version) VALUES (?, ?, ?, ?, ?, ?)"
  )

  insertSlot.run(1, 1, "09:00 AM", 1, "Walk-in", 1)
  insertSlot.run(2, 1, "10:00 AM", 3, "Scheduled", 1)
  insertSlot.run(3, 1, "11:00 AM", 0, "Emergency", 1)
  insertSlot.run(4, 2, "09:00 AM", 1, "Walk-in", 1)
}

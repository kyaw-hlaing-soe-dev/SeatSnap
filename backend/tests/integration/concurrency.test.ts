import request from "supertest"
import { db } from "../setup/db"

const api = request(process.env.BACKEND_URL ?? "http://localhost:4000")

function assertStockInvariant(slotId: number, originalStock: number): void {
  const slot = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = ?").get(slotId) as {
    availableCount: number
  }
  const activeReservations = db
    .prepare("SELECT COUNT(*) as count FROM reservation WHERE slotId = ? AND status = 'PENDING'")
    .get(slotId) as { count: number }
  expect(slot.availableCount + activeReservations.count).toBe(originalStock)
}

describe("Concurrency - The Double-Booking Problem", () => {
  test("PESSIMISTIC: only one patient gets the last slot", async () => {
    const N = 10

    const requests = Array.from({ length: N }, (_, i) =>
      api
        .post("/reserve")
        .set("X-Forwarded-For", `10.1.0.${i + 1}`)
        .send({ slotId: 1, userId: `patient-${i}` })
    )

    const results = await Promise.all(requests)
    const successes = results.filter((r) => r.status === 201)
    const conflicts = results.filter((r) => r.status === 409)

    expect(successes).toHaveLength(1)
    expect(conflicts).toHaveLength(N - 1)

    const slot = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = 1").get() as {
      availableCount: number
    }
    expect(slot.availableCount).toBe(0)

    const reservations = db
      .prepare("SELECT * FROM reservation WHERE slotId = 1 AND status = 'PENDING'")
      .all()
    expect(reservations).toHaveLength(1)

    assertStockInvariant(1, 1)
  })

  test("OPTIMISTIC: only one patient gets the last slot", async () => {
    const N = 10

    const requests = Array.from({ length: N }, (_, i) =>
      api.post("/reserve-optimistic").send({ slotId: 4, userId: `patient-${i}` })
    )

    const results = await Promise.all(requests)
    const successes = results.filter((r) => r.status === 201)
    const conflicts = results.filter((r) => r.status === 409)

    expect(successes).toHaveLength(1)
    expect(conflicts).toHaveLength(N - 1)

    const slot = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = 4").get() as {
      availableCount: number
    }
    expect(slot.availableCount).toBe(0)

    assertStockInvariant(4, 1)
  })

  test("stock never goes negative under any load", async () => {
    const N = 20

    const requests = Array.from({ length: N }, (_, i) =>
      api
        .post("/reserve")
        .set("X-Forwarded-For", `10.2.0.${i + 1}`)
        .send({ slotId: 2, userId: `patient-${i}` })
    )

    await Promise.all(requests)

    const slot = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = 2").get() as {
      availableCount: number
    }
    expect(slot.availableCount).toBeGreaterThanOrEqual(0)
    expect(slot.availableCount).toBe(0)

    const reservations = db
      .prepare("SELECT * FROM reservation WHERE slotId = 2 AND status = 'PENDING'")
      .all()
    expect(reservations).toHaveLength(3)

    assertStockInvariant(2, 3)
  })

  test("sum of reservations + availableCount always equals original stock", async () => {
    const originalStock = 3

    const requests = Array.from({ length: 15 }, (_, i) =>
      api
        .post("/reserve")
        .set("X-Forwarded-For", `10.3.0.${i + 1}`)
        .send({ slotId: 2, userId: `patient-${i}` })
    )

    await Promise.all(requests)

    const slot = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = 2").get() as {
      availableCount: number
    }
    const activeReservations = db
      .prepare("SELECT COUNT(*) as count FROM reservation WHERE slotId = 2 AND status = 'PENDING'")
      .get() as { count: number }

    expect(slot.availableCount + activeReservations.count).toBe(originalStock)
    assertStockInvariant(2, 3)
  })
})

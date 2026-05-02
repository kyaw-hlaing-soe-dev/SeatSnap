import request from "supertest"
import { db } from "../setup/db"

const api = request(process.env.BACKEND_URL ?? "http://localhost:4000")

describe("POST /reserve - pessimistic", () => {
  test("successfully reserves an available slot", async () => {
    const res = await api.post("/reserve").send({ slotId: 2, userId: "patient-001" })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      reservationId: expect.any(Number),
      expiresAt: expect.any(String),
      message: expect.any(String),
    })

    const slot = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = 2").get() as {
      availableCount: number
    }
    expect(slot.availableCount).toBe(2)

    const reservation = db
      .prepare("SELECT * FROM reservation WHERE id = ?")
      .get(res.body.reservationId) as { status: string; userId: string }
    expect(reservation.status).toBe("PENDING")
    expect(reservation.userId).toBe("patient-001")
  })

  test("returns 409 when slot has 0 availableCount", async () => {
    const res = await api.post("/reserve").send({ slotId: 3, userId: "patient-001" })

    expect(res.status).toBe(409)
    expect(res.body).toMatchObject({
      error: "CONFLICT",
      message: expect.any(String),
      ref: expect.any(String),
    })

    const slot = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = 3").get() as {
      availableCount: number
    }
    expect(slot.availableCount).toBe(0)
  })

  test("returns 404 when slotId does not exist", async () => {
    const res = await api.post("/reserve").send({ slotId: 9999, userId: "patient-001" })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe("NOT_FOUND")
  })

  test("returns 422 when userId is empty string", async () => {
    const res = await api.post("/reserve").send({ slotId: 1, userId: "" })
    expect(res.status).toBe(422)
    expect(res.body.error).toBe("VALIDATION_ERROR")
    expect(res.body.ref).toBeDefined()
  })

  test("returns 422 when unknown property sent", async () => {
    const res = await api.post("/reserve").send({ slotId: 1, userId: "patient-001", hack: "injection" })
    expect(res.status).toBe(422)
  })

  test("rollback proof: stock not lost if reservation save fails", async () => {
    db.prepare("ALTER TABLE reservation RENAME TO reservation_broken").run()

    const slotBefore = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = 2").get() as {
      availableCount: number
    }

    const res = await api.post("/reserve").send({ slotId: 2, userId: "patient-001" })
    expect(res.status).toBe(500)

    db.prepare("ALTER TABLE reservation_broken RENAME TO reservation").run()

    const slotAfter = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = 2").get() as {
      availableCount: number
    }
    expect(slotAfter.availableCount).toBe(slotBefore.availableCount)
  })
})

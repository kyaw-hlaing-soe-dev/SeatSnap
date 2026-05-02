import request from "supertest"
import { db } from "../setup/db"

const api = request(process.env.BACKEND_URL ?? "http://localhost:4000")

describe("POST /purchase", () => {
  let reservationId: number

  beforeEach(async () => {
    const res = await api.post("/reserve").send({ slotId: 2, userId: "patient-001" })
    reservationId = res.body.reservationId
  })

  test("successfully confirms a PENDING reservation", async () => {
    const res = await api.post("/purchase").send({ reservationId, userId: "patient-001" })

    expect(res.status).toBe(200)
    expect(res.body.reservation.status).toBe("COMPLETED")

    const row = db.prepare("SELECT status FROM reservation WHERE id = ?").get(reservationId) as {
      status: string
    }
    expect(row.status).toBe("COMPLETED")
  })

  test("returns 409 if already COMPLETED", async () => {
    await api.post("/purchase").send({ reservationId, userId: "patient-001" })
    const res = await api.post("/purchase").send({ reservationId, userId: "patient-001" })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe("CONFLICT")
  })

  test("returns 404 if wrong userId", async () => {
    const res = await api.post("/purchase").send({ reservationId, userId: "wrong-patient" })
    expect(res.status).toBe(404)
  })

  test("returns 409 if reservation is expired", async () => {
    db.prepare("UPDATE reservation SET expiresAt = datetime('now', '-1 minute') WHERE id = ?").run(
      reservationId
    )

    const res = await api.post("/purchase").send({ reservationId, userId: "patient-001" })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe("CONFLICT")
  })
})

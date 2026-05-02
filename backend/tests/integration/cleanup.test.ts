import "reflect-metadata"
import request from "supertest"
import { db } from "../setup/db"
import { runCleanup } from "../../src/cron"
import { AppDataSource } from "../../src/data-source"

const api = request(process.env.BACKEND_URL ?? "http://localhost:4000")

describe("Cleanup Cron - Ghost Slot Release", () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }
  })

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
    }
  })

  test("releases expired PENDING reservations and restores stock", async () => {
    const reserveRes = await api.post("/reserve").send({ slotId: 1, userId: "patient-ghost" })
    const { reservationId } = reserveRes.body as { reservationId: number }

    db.prepare("UPDATE reservation SET expiresAt = datetime('now', '-1 minute') WHERE id = ?").run(
      reservationId
    )

    const stockBefore = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = 1").get() as {
      availableCount: number
    }

    await runCleanup()

    const reservation = db.prepare("SELECT status FROM reservation WHERE id = ?").get(reservationId) as {
      status: string
    }
    expect(reservation.status).toBe("EXPIRED")

    const stockAfter = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = 1").get() as {
      availableCount: number
    }
    expect(stockAfter.availableCount).toBe(stockBefore.availableCount + 1)
  })

  test("does not release COMPLETED reservations", async () => {
    const reserveRes = await api.post("/reserve").send({ slotId: 2, userId: "patient-completed" })
    const { reservationId } = reserveRes.body as { reservationId: number }

    await api.post("/purchase").send({ reservationId, userId: "patient-completed" })

    db.prepare("UPDATE reservation SET expiresAt = datetime('now', '-1 minute') WHERE id = ?").run(
      reservationId
    )

    const stockBefore = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = 2").get() as {
      availableCount: number
    }

    await runCleanup()

    const reservation = db.prepare("SELECT status FROM reservation WHERE id = ?").get(reservationId) as {
      status: string
    }
    expect(reservation.status).toBe("COMPLETED")

    const stockAfter = db.prepare("SELECT availableCount FROM appointment_slot WHERE id = 2").get() as {
      availableCount: number
    }
    expect(stockAfter.availableCount).toBe(stockBefore.availableCount)
  })
})

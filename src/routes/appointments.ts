import { Router } from "express"
import { AppDataSource } from "../data-source"
import { AppointmentSlot } from "../entity/AppointmentSlot"
import { Reservation } from "../entity/Reservation"

export const appointmentRouter = Router()

appointmentRouter.post("/reserve", async (req, res) => {
  const { slotId, userId } = req.body

  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()

  try {
    const slot = await queryRunner.manager.findOne(AppointmentSlot, {
      where: { id: slotId },
      lock: { mode: "pessimistic_write" }
    })

    if (!slot) {
      await queryRunner.rollbackTransaction()
      return res.status(404).json({ error: "Slot not found" })
    }

    if (slot.availableCount <= 0) {
      await queryRunner.rollbackTransaction()
      return res.status(409).json({ error: "No slots available" })
    }

    slot.availableCount -= 1
    await queryRunner.manager.save(slot)

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    const reservation = queryRunner.manager.create(Reservation, {
      userId,
      slotId,
      status: "PENDING",
      expiresAt,
    })

    await queryRunner.manager.save(reservation)
    await queryRunner.commitTransaction()

    res.status(201).json({
      message: "Slot reserved! You have 5 minutes to confirm.",
      reservationId: reservation.id,
      expiresAt,
    })

  } catch (err) {
    await queryRunner.rollbackTransaction()
    console.error("Reservation failed, rolling back:", err)
    res.status(500).json({ error: "Reservation failed" })

  } finally {
    await queryRunner.release()
  }
})

appointmentRouter.post("/purchase", async (req, res) => {
  const { reservationId, userId } = req.body

  const reservationRepo = AppDataSource.getRepository(Reservation)

  const reservation = await reservationRepo.findOne({
    where: { id: reservationId, userId }
  })

  if (!reservation) {
    return res.status(404).json({ error: "Reservation not found" })
  }

  if (reservation.status !== "PENDING") {
    return res.status(400).json({ error: `Cannot purchase a ${reservation.status} reservation` })
  }

  if (new Date() > reservation.expiresAt) {
    return res.status(410).json({ error: "Reservation has expired" })
  }

  reservation.status = "COMPLETED"
  await reservationRepo.save(reservation)

  res.json({ message: "Appointment confirmed!", reservation })
})

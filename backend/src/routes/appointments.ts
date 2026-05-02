import { Router } from "express"
import { AppDataSource } from "../data-source"
import { AppointmentSlot } from "../entity/AppointmentSlot"
import { Reservation } from "../entity/Reservation"
import { ConflictError, NotFoundError } from "../errors/AppError"
import { reserveRateLimiter } from "../middleware/rateLimiter"
import { validate } from "../middleware/validate"
import { purchaseSchema, reserveSchema } from "../schemas/reservation.schema"
import { OptimisticLockVersionMismatchError } from "typeorm"
import { asyncHandler } from "../middleware/asyncHandler"

export const appointmentRouter = Router()

/**
 * @openapi
 * /reserve:
 *   post:
 *     summary: Reserve an appointment slot
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slotId, userId]
 *             properties:
 *               slotId:
 *                 type: integer
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Slot reserved successfully
 *       404:
 *         description: Slot not found
 *       409:
 *         description: No slots available (conflict)
 *       422:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 */
appointmentRouter.post("/reserve", reserveRateLimiter, validate(reserveSchema), asyncHandler(async (req, res) => {
  const { slotId, userId } = req.body
  const slotRepo = AppDataSource.getRepository(AppointmentSlot)
  const reservationRepo = AppDataSource.getRepository(Reservation)

  const updateResult = await slotRepo
    .createQueryBuilder()
    .update(AppointmentSlot)
    .set({ availableCount: () => "availableCount - 1" })
    .where("id = :slotId AND availableCount > 0", { slotId })
    .execute()

  if (updateResult.affected === 0) {
    const slot = await slotRepo.findOne({ where: { id: slotId } })
    if (!slot) {
      throw new NotFoundError("Slot not found")
    }
    throw new ConflictError("No slots available")
  }

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
  const reservation = reservationRepo.create({
    userId,
    slotId,
    status: "PENDING",
    expiresAt,
  })

  try {
    await reservationRepo.save(reservation)
  } catch (err) {
    await slotRepo
      .createQueryBuilder()
      .update(AppointmentSlot)
      .set({ availableCount: () => "availableCount + 1" })
      .where("id = :slotId", { slotId })
      .execute()
    throw err
  }

  res.status(201).json({
    message: "Slot reserved! You have 5 minutes to confirm.",
    reservationId: reservation.id,
    expiresAt,
  })
}))

/**
 * @openapi
 * /reserve-optimistic:
 *   post:
 *     summary: Reserve an appointment slot using optimistic locking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slotId, userId]
 *             properties:
 *               slotId:
 *                 type: integer
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Slot reserved successfully
 *       409:
 *         description: Slot was taken by another user
 *       422:
 *         description: Validation error
 */
appointmentRouter.post("/reserve-optimistic", validate(reserveSchema), asyncHandler(async (req, res) => {
  const { slotId, userId } = req.body

  const slotRepo = AppDataSource.getRepository(AppointmentSlot)
  const reservationRepo = AppDataSource.getRepository(Reservation)

  const updateResult = await slotRepo
    .createQueryBuilder()
    .update(AppointmentSlot)
    .set({ availableCount: () => "availableCount - 1" })
    .where("id = :slotId AND availableCount > 0", { slotId })
    .execute()

  if (updateResult.affected === 0) {
    throw new ConflictError("No slots available")
  }

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
  const reservation = reservationRepo.create({
    userId,
    slotId,
    status: "PENDING",
    expiresAt,
  })

  try {
    await reservationRepo.save(reservation)
  } catch (err) {
    if (err instanceof OptimisticLockVersionMismatchError) {
      throw new ConflictError("Slot taken by another user, please retry")
    }
    throw err
  }

  res.status(201).json({
    message: "Slot reserved! You have 5 minutes to confirm.",
    reservationId: reservation.id,
    expiresAt,
  })
}))

/**
 * @openapi
 * /purchase:
 *   post:
 *     summary: Purchase a reserved appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reservationId, userId]
 *             properties:
 *               reservationId:
 *                 type: integer
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment confirmed
 *       404:
 *         description: Reservation not found
 *       409:
 *         description: Reservation cannot be purchased
 *       422:
 *         description: Validation error
 */
appointmentRouter.post("/purchase", validate(purchaseSchema), asyncHandler(async (req, res) => {
  const { reservationId, userId } = req.body

  const reservationRepo = AppDataSource.getRepository(Reservation)
  const reservation = await reservationRepo.findOne({
    where: { id: reservationId, userId }
  })

  if (!reservation) {
    throw new NotFoundError("Reservation not found")
  }

  if (reservation.status !== "PENDING") {
    throw new ConflictError(`Cannot purchase a ${reservation.status} reservation`)
  }

  if (new Date() > reservation.expiresAt) {
    throw new ConflictError("Reservation has expired")
  }

  reservation.status = "COMPLETED"
  await reservationRepo.save(reservation)

  res.status(200).json({ message: "Appointment confirmed!", reservation })
}))

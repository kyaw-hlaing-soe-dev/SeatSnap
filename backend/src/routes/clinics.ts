import { Router } from "express"
import { AppDataSource } from "../data-source"
import { Clinic } from "../entity/Clinic"
import { toSlotDTO } from "../dto/slot.dto"
import { clinicQuerySchema } from "../schemas/clinic.schema"
import { ValidationError } from "../errors/AppError"
import { asyncHandler } from "../middleware/asyncHandler"

export const clinicRouter = Router()

/**
 * @openapi
 * /clinics:
 *   get:
 *     summary: Get clinics with available slots
 *     responses:
 *       200:
 *         description: List of clinics with slot DTOs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   slots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         timeLabel:
 *                           type: string
 *                         availableCount:
 *                           type: integer
 *                         category:
 *                           type: string
 *                         clinicId:
 *                           type: integer
 */
clinicRouter.get("/", asyncHandler(async (req, res) => {
  const queryResult = clinicQuerySchema.safeParse(req.query)
  if (!queryResult.success) {
    throw new ValidationError(queryResult.error.message)
  }

  const query = queryResult.data
  const clinics = await AppDataSource
    .getRepository(Clinic)
    .find({
      relations: ["slots"],
      where: query.clinicId ? { id: query.clinicId } : undefined,
    })

  const response = clinics.map((clinic) => ({
    id: clinic.id,
    name: clinic.name,
    address: clinic.address,
    slots: clinic.slots.map(toSlotDTO),
  }))

  res.json(response)
}))

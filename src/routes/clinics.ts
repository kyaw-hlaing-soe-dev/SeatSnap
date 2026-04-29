import { Router } from "express"
import { AppDataSource } from "../data-source"
import { Clinic } from "../entity/Clinic"
import { MoreThan } from "typeorm/find-options/operator/MoreThan.js"

export const clinicRouter = Router()

clinicRouter.get("/", async (req, res) => {
  try {
    const clinics = await AppDataSource
      .getRepository(Clinic)
      .find({
        relations: ["slots"],
        where: {
          slots: { availableCount: MoreThan(0) }
        }
      })

    res.json(clinics)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch clinics" })
  }
})

import "reflect-metadata"
import "dotenv/config"
import express from "express"
import cors from "cors"
import swaggerUi from "swagger-ui-express"
import { AppDataSource } from "./data-source"
import { appointmentRouter } from "./routes/appointments"
import { clinicRouter } from "./routes/clinics"
import { startCleanupJob } from "./cron"
import { correlationIdMiddleware } from "./middleware/correlationId"
import { errorHandler } from "./middleware/errorHandler"
import { logger } from "./logger"
import { swaggerSpec } from "./swagger"

const app = express()
const PORT = Number(process.env.PORT ?? 3000)

app.set("trust proxy", true)
app.use(express.json())
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ["GET", "POST", "PUT"],
  allowedHeaders: ["Content-Type", "X-Correlation-ID"]
}))
app.use(correlationIdMiddleware)

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use("/clinics", clinicRouter)
app.use("/", appointmentRouter)
app.use(errorHandler)

AppDataSource.initialize()
  .then(() => {
    const server = app.listen(PORT, () => {
      logger.info(`SeatSnap running on http://localhost:${PORT}`)
    })
    startCleanupJob()

    process.on("SIGTERM", () => {
      logger.info("SIGTERM received. Shutting down gracefully.")

      const forceExit = setTimeout(() => {
        logger.error("Forced exit")
        process.exit(1)
      }, 5000)

      server.close(async () => {
        clearTimeout(forceExit)
        await AppDataSource.destroy()
        logger.info("DB closed. Exiting.")
        process.exit(0)
      })
    })
  })
  .catch((err) => {
    logger.error("DB connection failed", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    })
    process.exit(1)
  })

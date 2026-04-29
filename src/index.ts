import "reflect-metadata"
import express from "express"
import { AppDataSource } from "./data-source"
import { clinicRouter } from "./routes/clinics"
import { appointmentRouter } from "./routes/appointments"
import { startCleanupJob } from "./cron"

const app = express()
app.use(express.json())

app.use("/clinics", clinicRouter)
app.use("/", appointmentRouter)

AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connected")
    startCleanupJob()
    app.listen(3000, () => {
      console.log("🏅 SeatSnap running on http://localhost:3000")
    })
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err)
    process.exit(1)
  })

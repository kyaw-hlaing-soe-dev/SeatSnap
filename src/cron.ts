import cron from "node-cron"
import { AppDataSource } from "./data-source"
import { Reservation } from "./entity/Reservation"
import { LessThan } from "typeorm"

export function startCleanupJob() {
  cron.schedule("* * * * *", async () => {
    console.log("[Cron] Running ghost appointment cleanup...")

    const queryRunner = AppDataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const expired = await queryRunner.manager.find(Reservation, {
        where: {
          status: "PENDING",
          expiresAt: LessThan(new Date()),
        },
        relations: ["slot"],
      })

      if (expired.length === 0) {
        console.log("[Cron] No expired reservations found.")
        await queryRunner.release()
        return
      }

      for (const res of expired) {
        res.status = "EXPIRED"
        await queryRunner.manager.save(res)

        res.slot.availableCount += 1
        await queryRunner.manager.save(res.slot)
      }

      await queryRunner.commitTransaction()
      console.log(`[Cron] Released ${expired.length} ghost reservation(s).`)
    } catch (err) {
      await queryRunner.rollbackTransaction()
      console.error("[Cron] Cleanup failed:", err)
    } finally {
      await queryRunner.release()
    }
  })
}

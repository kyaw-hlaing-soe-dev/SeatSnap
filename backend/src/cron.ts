import cron from "node-cron"
import { AppDataSource } from "./data-source"
import { Reservation } from "./entity/Reservation"
import { LessThan } from "typeorm"
import { logger } from "./logger"

export async function runCleanup(): Promise<number> {
  const queryRunner = AppDataSource.createQueryRunner()

  try {
    await queryRunner.connect()
    await queryRunner.startTransaction()

    const expired = await queryRunner.manager.find(Reservation, {
      where: {
        status: "PENDING",
        expiresAt: LessThan(new Date()),
      },
      relations: ["slot"],
    })

    if (expired.length === 0) {
      await queryRunner.commitTransaction()
      logger.info("No expired reservations")
      return 0
    }

    for (const reservation of expired) {
      reservation.status = "EXPIRED"
      await queryRunner.manager.save(reservation)

      reservation.slot.availableCount += 1
      await queryRunner.manager.save(reservation.slot)
    }

    await queryRunner.commitTransaction()
    logger.info(`Released ${expired.length} ghost reservations`)
    return expired.length
  } catch (err) {
    await queryRunner.rollbackTransaction()
    logger.error("Ghost reservation cleanup failed", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    })
    throw err
  } finally {
    await queryRunner.release()
  }
}

export function startCleanupJob() {
  cron.schedule("* * * * *", async () => {
    try {
      await runCleanup()
    } catch {
      // runCleanup logs the full error payload.
    }
  })
}

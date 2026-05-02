import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1777478725160 implements MigrationInterface {
    name = 'InitSchema1777478725160'

 public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE clinic (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        name    TEXT NOT NULL,
        address TEXT NOT NULL
      )
    `)

    await queryRunner.query(`
      CREATE TABLE appointment_slot (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        timeLabel       TEXT NOT NULL,
        availableCount  INTEGER NOT NULL DEFAULT 1,
        clinicId        INTEGER NOT NULL,
        FOREIGN KEY (clinicId) REFERENCES clinic(id)
      )
    `)

    await queryRunner.query(`
      CREATE INDEX IDX_slot_clinicId ON appointment_slot(clinicId)
    `)

    await queryRunner.query(`
      CREATE TABLE reservation (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        userId    TEXT NOT NULL,
        status    TEXT NOT NULL DEFAULT 'PENDING',
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        slotId    INTEGER NOT NULL,
        FOREIGN KEY (slotId) REFERENCES appointment_slot(id)
      )
    `)

    await queryRunner.query(`
      CREATE INDEX IDX_reservation_pending
        ON reservation(status)
        WHERE status = 'PENDING'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_reservation_pending`)
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_slot_clinicId`)
    await queryRunner.query(`DROP TABLE IF EXISTS reservation`)
    await queryRunner.query(`DROP TABLE IF EXISTS appointment_slot`)
    await queryRunner.query(`DROP TABLE IF EXISTS clinic`)
  }

}
